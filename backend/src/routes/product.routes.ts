import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
} from "@/components/admin/TableStates";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api, apiGetList, getApiErrorMessage } from "@/lib/api";
import { formatCurrency, idOf, nameOf, slugify, entityId } from "@/lib/format";
import type { Category, Product, ProductVariant } from "@/lib/types";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — Snap's Mirror Admin" },
      {
        name: "description",
        content:
          "Manage the Snap's Mirror catalogue: pricing, images, stock and per-variant inventory.",
      },
      { property: "og:title", content: "Products — Snap's Mirror Admin" },
      {
        property: "og:description",
        content: "Add, edit and publish mirrors with variant-level SKUs and stock.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProductsPage,
});

interface ProductForm {
  name: string;
  slug: string;
  description: string;
  basePrice: string;
  discountPrice: string;
  category: string;
  images: string[]; // URL-based images (typed in manually)
  isActive: boolean;
  variants: ProductVariant[];
}

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  description: "",
  basePrice: "",
  discountPrice: "",
  category: "",
  images: [""],
  isActive: true,
  variants: [],
};

// A small, friendly palette for the colour swatch picker. The admin can still
// fall back to the native colour wheel for anything not in this list.
const SWATCH_PRESETS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Grey", hex: "#808080" },
  { name: "Navy", hex: "#1F2A44" },
  { name: "Brown", hex: "#8B5E34" },
  { name: "Beige", hex: "#D8C4A3" },
  { name: "Red", hex: "#C0392B" },
  { name: "Green", hex: "#2E7D32" },
  { name: "Blue", hex: "#1565C0" },
  { name: "Gold", hex: "#C9A227" },
];

function isValidHex(value: string | undefined | null): value is string {
  return !!value && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);
}

function totalStock(product: Product) {
  if (product.variants?.length) {
    return product.variants.reduce((sum, v) => sum + (Number(v.stock ?? v.stock_quantity ?? v.stockQuantity) || 0), 0);
  }
  return null;
}

function ProductsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  // NEW: multiple device-uploaded files instead of a single file.
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);

  const resetImageFiles = () => {
    setImagePreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
    setImageFiles([]);
  };

  // NEW: append newly picked files to whatever is already staged, so the
  // admin can add a few, then add a few more, without losing earlier picks.
  const onImageFilesChange = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const newFiles = Array.from(fileList).slice(0, 6 - imageFiles.length);
    if (newFiles.length === 0) {
      toast.error("You can upload up to 6 images per product");
      return;
    }
    setImageFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))]);
  };

  const removeImageFileAt = (index: number) => {
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: () => apiGetList<Product>("/admin/products"),
  });
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGetList<Category>("/admin/categories"),
  });

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const products = productsQuery.data ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["products"] });

  const discountPriceValue = (values: ProductForm): number | null =>
    values.discountPrice.trim() === "" ? null : Number(values.discountPrice);

  const saveMutation = useMutation({
    mutationFn: async (values: ProductForm) => {
      const discount = discountPriceValue(values);
      if (discount !== null && discount >= Number(values.basePrice)) {
        throw new Error("Discount price must be lower than base price");
      }

      const urlImages = values.images.map((i) => i.trim()).filter(Boolean);
      const variants = values.variants.map((v) => ({
        size: v.size ?? "",
        color: v.color ?? "",
        sku: v.sku ?? "",
        price: v.price === null || v.price === undefined || v.price === ("" as never)
          ? null
          : Number(v.price),
        stock_quantity: Number(v.stock) || 0,
      }));

      if (imageFiles.length > 0) {
        // Multipart upload — one or more files under the same field name
        // "newImages" (the backend's uploadMultipleImages middleware reads
        // this), plus any manually-typed URL images as a JSON string.
        const fd = new FormData();
        imageFiles.forEach((file) => fd.append("newImages", file));
        fd.append("name", values.name);
        fd.append("slug", values.slug);
        fd.append("description", values.description);
        fd.append("base_price", String(Number(values.basePrice) || 0));
        fd.append("discount_price", discount === null ? "" : String(discount));
        if (values.category) fd.append("category_id", values.category);
        fd.append("is_active", String(values.isActive));
        fd.append("images", JSON.stringify(urlImages));
        fd.append("variants", JSON.stringify(variants));
        if (editing) return api.patch(`/admin/products/${entityId(editing)}`, fd);
        return api.post("/admin/products", fd);
      }

      const payload = {
        name: values.name,
        slug: values.slug,
        description: values.description,
        base_price: Number(values.basePrice) || 0,
        discount_price: discount,
        category_id: values.category || null,
        images: urlImages,
        is_active: values.isActive,
        variants,
      };
      if (editing) return api.patch(`/admin/products/${entityId(editing)}`, payload);
      return api.post("/admin/products", payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Product updated" : "Product created");
      resetImageFiles();
      setOpen(false);
      invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Could not save product")),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ product, isActive }: { product: Product; isActive: boolean }) =>
      api.patch(`/admin/products/${entityId(product)}`, { is_active: isActive }),

    onSuccess: () => {
      toast.success("Product visibility updated");
      invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Could not update product")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/products/${id}`),
    onSuccess: () => {
      toast.success("Product deleted");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Could not delete product")),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    resetImageFiles();
    setSlugTouched(false);
    setOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name ?? "",
      slug: product.slug ?? "",
      description: product.description ?? "",
      basePrice: String(product.basePrice ?? product.base_price ?? ""),
      discountPrice:
        product.discountPrice ?? product.discount_price
          ? String(product.discountPrice ?? product.discount_price)
          : "",
      category: idOf(product.category ?? product.category_id),
      images: product.images?.length ? product.images : [""],
      isActive: product.isActive ?? product.is_active ?? true,
      variants: (product.variants ?? []).map((v) => ({
        ...v,
        stock: Number(v.stock ?? v.stock_quantity ?? v.stockQuantity) || 0,
      })),
    });
    resetImageFiles();
    setSlugTouched(true);
    setOpen(true);
  };

  const updateVariant = (index: number, patch: Partial<ProductVariant>) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));

  return (
    <AdminLayout>
      <PageHeader
        title="Products"
        description="Your full mirror catalogue, variants included."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> Add Product
          </Button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Base price</TableHead>
              <TableHead className="text-right">Discount price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-[110px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsQuery.isLoading ? (
              <TableLoadingRows columns={8} />
            ) : productsQuery.isError ? (
              <TableErrorRow columns={8} message={getApiErrorMessage(productsQuery.error)} />
            ) : products.length === 0 ? (
              <TableEmptyRow
                columns={8}
                title="No products yet"
                description="Add your first mirror to start selling."
                action={
                  <Button size="sm" onClick={openCreate}>
                    <Plus className="size-4" /> Add Product
                  </Button>
                }
              />
            ) : (
              products.map((product) => {
                const stock = totalStock(product);
                const thumb = product.images?.[0];
                const discount = product.discountPrice ?? product.discount_price;
                return (
                  <TableRow key={entityId(product)}>
                    <TableCell>
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={product.name}
                          className="size-12 rounded-md border border-border object-cover"
                        />
                      ) : (
                        <div className="flex size-12 items-center justify-center rounded-md border border-dashed border-border bg-muted text-[10px] text-muted-foreground">
                          No img
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.slug}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {nameOf(product.category ?? product.category_id)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.basePrice ?? product.base_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      {discount ? (
                        <span className="font-medium text-destructive">
                          {formatCurrency(discount)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {stock === null ? (
                        <StatusBadge status="in stock" tone="neutral" />
                      ) : stock > 0 ? (
                        <StatusBadge status={`${stock} in stock`} tone="success" />
                      ) : (
                        <StatusBadge status="out of stock" tone="danger" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={product.isActive ?? product.is_active ?? true}
                        aria-label="Toggle active"
                        onCheckedChange={(checked) =>
                          toggleMutation.mutate({ product, isActive: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Edit product"
                          onClick={() => openEdit(product)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete product"
                          onClick={() => setDeleteTarget(product)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
          </DialogHeader>

          <form
            id="product-form"
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate(form);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-name">Name</Label>
                <Input
                  id="p-name"
                  required
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-slug">Slug</Label>
                <Input
                  id="p-slug"
                  required
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setForm((f) => ({ ...f, slug: e.target.value }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-price">Base price</Label>
                <Input
                  id="p-price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={form.basePrice}
                  onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-discount-price">Discount price (optional)</Label>
                <Input
                  id="p-discount-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Leave empty for no discount"
                  value={form.discountPrice}
                  onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value }))}
                />
                {form.discountPrice &&
                  Number(form.discountPrice) >= Number(form.basePrice || 0) && (
                    <p className="text-xs text-destructive">
                      Discount price must be lower than the base price.
                    </p>
                  )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-category">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm((f) => ({ ...f, category: value }))}
                >
                  <SelectTrigger id="p-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={entityId(c)} value={entityId(c)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea
                id="p-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Images</Label>

              {/* Already-saved images when editing (URLs from the database). */}
              {editing && form.images.filter(Boolean).length > 0 ? (
                <div className="flex flex-wrap gap-2 rounded-lg border border-border p-2">
                  {form.images.filter(Boolean).map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt="Current product image"
                      className="size-16 rounded-md border border-border object-cover"
                    />
                  ))}
                </div>
              ) : null}

              <div className="space-y-2">
                {form.images.map((image, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={image}
                      placeholder="https://…/mirror.jpg"
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          images: f.images.map((img, i) => (i === index ? e.target.value : img)),
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove image"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          images: f.images.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setForm((f) => ({ ...f, images: [...f.images, ""] }))}
              >
                <Plus className="size-4" /> Add image URL
              </Button>

              {/* NEW: multi-file device upload (up to 6 at once) */}
              <div className="rounded-lg border border-dashed border-border p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Or upload multiple photos from your device (jpg, png, webp) — up to 6
                </p>

                {imagePreviews.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={preview} className="relative">
                        <img
                          src={preview}
                          alt={`Selected image ${index + 1}`}
                          className="size-16 rounded-md border border-border object-cover"
                        />
                        <button
                          type="button"
                          aria-label="Remove this image"
                          onClick={() => removeImageFileAt(index)}
                          className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                {imageFiles.length < 6 ? (
                  <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <ImagePlus className="size-4" />
                    {imageFiles.length > 0 ? "Add more…" : "Choose images…"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="sr-only"
                      onChange={(e) => {
                        onImageFilesChange(e.target.files);
                        // allow re-selecting the same file name later
                        e.target.value = "";
                      }}
                    />
                  </label>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">Maximum of 6 images reached.</p>
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Variants</p>
                  <p className="text-xs text-muted-foreground">
                    Size, colour, SKU, price override and stock.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      variants: [
                        ...f.variants,
                        { size: "", color: "", sku: "", price: null, stock: 0 },
                      ],
                    }))
                  }
                >
                  <Plus className="size-4" /> Add variant
                </Button>
              </div>

              {form.variants.length === 0 ? (
                <p className="py-3 text-center text-sm text-muted-foreground">
                  No variants — the base price and stock apply.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Size</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.variants.map((variant, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            value={variant.size ?? ""}
                            onChange={(e) => updateVariant(index, { size: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          {/* NEW: colour swatch picker instead of a plain text input */}
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              aria-label="Pick variant colour"
                              value={isValidHex(variant.color) ? variant.color! : "#000000"}
                              onChange={(e) => updateVariant(index, { color: e.target.value })}
                              className="size-8 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0.5"
                            />
                            <Select
                              value={isValidHex(variant.color) ? variant.color! : undefined}
                              onValueChange={(hex) => updateVariant(index, { color: hex })}
                            >
                              <SelectTrigger className="h-8 w-[110px] text-xs">
                                <SelectValue placeholder="Presets" />
                              </SelectTrigger>
                              <SelectContent>
                                {SWATCH_PRESETS.map((p) => (
                                  <SelectItem key={p.hex} value={p.hex}>
                                    <span className="flex items-center gap-2">
                                      <span
                                        className="inline-block size-3 rounded-full border border-border"
                                        style={{ backgroundColor: p.hex }}
                                      />
                                      {p.name}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={variant.sku ?? ""}
                            onChange={(e) => updateVariant(index, { sku: e.target.value })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.price ?? ""}
                            onChange={(e) =>
                              updateVariant(index, {
                                price: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            value={variant.stock ?? 0}
                            onChange={(e) =>
                              updateVariant(index, { stock: Number(e.target.value) || 0 })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Remove variant"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                variants: f.variants.filter((_, i) => i !== index),
                              }))
                            }
                          >
                            <X className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Active</p>
                <p className="text-xs text-muted-foreground">Visible on the storefront.</p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
              />
            </div>
          </form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="product-form" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : "Save product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" and its variants will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(entityId(deleteTarget))}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
