import slugify from "slugify";
import { Category } from "../../models/Category.js";

export async function getAllCategories(includeInactive = false) {
  const query = includeInactive ? {} : { isActive: true };
  return Category.find(query)
    .sort({ displayOrder: 1, name: 1 })
    .lean();
}

export async function getCategoryBySlug(slug) {
  return Category.findOne({ slug: slug.toLowerCase() }).lean();
}

export async function getCategoryById(id) {
  return Category.findById(id);
}

export async function createCategory(data) {
  const baseSlug = data.slug || slugify(data.name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;
  while (await Category.exists({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const category = new Category({
    ...data,
    slug,
  });
  await category.save();
  return category;
}

export async function updateCategory(id, updates) {
  const category = await Category.findById(id);
  if (!category) {
    const err = new Error("Category not found");
    err.statusCode = 404;
    err.code = "CATEGORY_NOT_FOUND";
    throw err;
  }

  if (updates.name && !updates.slug) {
    updates.slug = slugify(updates.name, { lower: true, strict: true });
  }

  Object.assign(category, updates);
  await category.save();
  return category;
}

export async function deleteCategory(id) {
  const category = await Category.findById(id);
  if (!category) {
    const err = new Error("Category not found");
    err.statusCode = 404;
    err.code = "CATEGORY_NOT_FOUND";
    throw err;
  }

  category.isActive = false;
  await category.save();
  return { id, deactivated: true };
}
