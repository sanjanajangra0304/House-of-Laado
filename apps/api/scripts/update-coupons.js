import { connectDB, disconnectDB } from "../src/config/db.js";
import { Coupon } from "../src/models/Coupon.js";

async function main() {
  await connectDB();

  const couponsData = [
    {
      code: "WELCOME10",
      title: "10% Welcome Discount",
      description: "Enjoy 10% off on your first handcrafted order from our Jaipur atelier.",
      badge: "NEW ARRIVAL",
      discountType: "percentage",
      discountValue: 10,
      minOrderValue: 999,
      maxDiscountAmount: 500,
      isActive: true,
    },
    {
      code: "FESTIVE20",
      title: "Royal Festive 20% Off",
      description: "Flat 20% savings on royal Chanderi, Anarkali & festive silk kurta sets.",
      badge: "FESTIVE EDIT",
      discountType: "percentage",
      discountValue: 20,
      minOrderValue: 1999,
      maxDiscountAmount: 1000,
      isActive: true,
    },
    {
      code: "JAIPUR15",
      title: "Jaipur Artisan 15% Off",
      description: "Special 15% off celebrating authentic Sanganeri hand-block prints.",
      badge: "ARTISAN CRAFT",
      discountType: "percentage",
      discountValue: 15,
      minOrderValue: 1499,
      maxDiscountAmount: 600,
      isActive: true,
    },
    {
      code: "FREESHIP",
      title: "Free Express Shipping",
      description: "Complimentary premium courier delivery straight to your doorstep across India.",
      badge: "FREE DELIVERY",
      discountType: "flat",
      discountValue: 99,
      minOrderValue: 799,
      maxDiscountAmount: 99,
      isActive: true,
    },
  ];

  for (const c of couponsData) {
    const updated = await Coupon.findOneAndUpdate(
      { code: c.code },
      { $set: c },
      { upsert: true, new: true }
    );
    console.log(`Updated coupon: ${updated.code} -> ${updated.title}`);
  }

  await disconnectDB();
}

main().catch((err) => {
  console.error("Error updating coupons:", err);
  process.exit(1);
});
