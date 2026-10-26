import * as categoryService from "./category.service.js";

export async function getCategories(req, res, next) {
  try {
    const includeInactive = req.query.all === "true";
    const categories = await categoryService.getAllCategories(includeInactive);
    res.json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCategory(req, res, next) {
  try {
    const { slug } = req.params;
    const category = await categoryService.getCategoryBySlug(slug);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: "CATEGORY_NOT_FOUND",
          message: `Category with slug '${slug}' not found.`,
        },
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req, res, next) {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    res.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const result = await categoryService.deleteCategory(req.params.id);
    res.json({
      success: true,
      message: "Category deleted successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
