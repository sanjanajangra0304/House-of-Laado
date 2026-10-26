import mongoose from "mongoose";
import * as productService from "./product.service.js";

export async function listProducts(req, res, next) {
  try {
    const result = await productService.getProducts(req.query);
    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    const { slug } = req.params;
    let product = null;

    if (mongoose.Types.ObjectId.isValid(slug)) {
      product = await productService.getProductById(slug);
    }
    if (!product) {
      product = await productService.getProductBySlug(slug);
    }

    if (!product || product.status === "archived") {
      return res.status(404).json({
        success: false,
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: `Product '${slug}' was not found or is unavailable.`,
        },
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
}

export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: "Invalid product identifier format.",
        },
      });
    }
    const product = await productService.getProductById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: `Product was not found.`,
        },
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
}

export async function getFeaturedProducts(req, res, next) {
  try {
    const limit = Number(req.query.limit) || 8;
    const products = await productService.getFeaturedProducts(limit);
    res.json({
      success: true,
      data: products,
    });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req, res, next) {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: "Invalid product identifier format.",
        },
      });
    }
    const product = await productService.updateProduct(id, req.body);
    res.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: "Invalid product identifier format.",
        },
      });
    }
    const result = await productService.deleteProduct(id);
    res.json({
      success: true,
      message: "Product archived successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function bulkUpdatePrices(req, res, next) {
  try {
    const result = await productService.bulkUpdatePrices(req.body);
    res.json({
      success: true,
      message: `Successfully updated prices for ${result.updatedCount} products`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function bulkUpdateStock(req, res, next) {
  try {
    const result = await productService.bulkUpdateStock(req.body.updates);
    res.json({
      success: true,
      message: `Successfully updated stock for ${result.updatedCount} items`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function exportCSV(req, res, next) {
  try {
    const csvContent = await productService.exportProductsCSV();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="house_of_laado_products_export.csv"');
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
}
