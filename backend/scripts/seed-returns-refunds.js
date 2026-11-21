const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function seedReturnsAndRefunds() {
  console.log("Seeding returns and refunds data...");

  // 1. Fetch some existing orders
  const orders = await prisma.order.findMany({
    take: 12,
    include: { items: true }
  });

  if (orders.length === 0) {
    console.log("No orders found. Please ensure orders exist first.");
    return;
  }

  console.log(`Found ${orders.length} orders to attach returns & refunds to.`);

  // 2. Clear existing test return requests and refunds if any
  await prisma.refund.deleteMany({});
  await prisma.returnRequest.deleteMany({});
  console.log("Cleared old return requests and refunds.");

  // Sample return scenarios
  const sampleReturns = [
    {
      status: "pending",
      reason: "Wrong size",
      adminNote: "Customer ordered Size 42, needs Size 43. Sneaker unused in original box.",
      product_name: "Nike Air Jordan 4 Retro White Oreo (Size 42)",
      refund_multiplier: 1.0,
      daysAgo: 1
    },
    {
      status: "pending",
      reason: "Defective",
      adminNote: "Stitching coming apart near toe box. Customer provided photo.",
      product_name: "Yeezy Boost 350 V2 Carbon (Size 41)",
      refund_multiplier: 1.0,
      daysAgo: 2
    },
    {
      status: "approved",
      reason: "Wrong size",
      adminNote: "Approved exchange for size 44. Waiting for customer return parcel via PostEx.",
      product_name: "New Balance 990v6 Made in USA (Size 40)",
      refund_multiplier: 1.0,
      daysAgo: 4
    },
    {
      status: "processing",
      reason: "Damaged product",
      adminNote: "Shoe box crushed in transit by courier. Parcel arrived at warehouse, inspecting condition.",
      product_name: "Nike Dunk Low Retro White Black Panda (Size 43)",
      refund_multiplier: 1.0,
      daysAgo: 5
    },
    {
      status: "refunded",
      reason: "Wrong product",
      adminNote: "Warehouse mistakenly packed Navy instead of Triple Black. Returned & refunded to card.",
      product_name: "Air Jordan 1 High OG Lost & Found (Size 44)",
      refund_multiplier: 1.0,
      daysAgo: 8
    },
    {
      status: "refunded",
      reason: "Defective",
      adminNote: "Factory air bubble issue. Refund settled via bank transfer.",
      product_name: "Nike Air Max Plus Drift Sunset (Size 42)",
      refund_multiplier: 1.0,
      daysAgo: 12
    },
    {
      status: "rejected",
      reason: "Changed mind",
      adminNote: "Sneaker was worn outdoors for 10 days, dirty soles. Rejected per return policy.",
      product_name: "Travis Scott x Jordan 1 Low Olive (Size 42.5)",
      refund_multiplier: 0,
      daysAgo: 14
    }
  ];

  const createdReturns = [];

  for (let i = 0; i < sampleReturns.length; i++) {
    const spec = sampleReturns[i];
    const order = orders[i % orders.length];
    const item = order.items?.[0];
    const createdAt = new Date(Date.now() - spec.daysAgo * 24 * 60 * 60 * 1000);
    const refundAmount = Math.round(order.total * spec.refund_multiplier);

    const ret = await prisma.returnRequest.create({
      data: {
        id: uuidv4(),
        order_id: order.id,
        order_number: order.order_number,
        customer_name: order.customer_name || "Customer",
        customer_phone: order.customer_phone || "0300 1234567",
        product_id: item?.product_id || null,
        product_name: spec.product_name || item?.product_name || "Sneaker Pair",
        quantity: 1,
        refund_amount: refundAmount,
        reason: spec.reason,
        status: spec.status,
        created_at: createdAt
      }
    });

    createdReturns.push(ret);
    console.log(`Created return #${ret.id.split('-')[0]} for Order ${order.order_number} [${ret.status}]`);
  }

  // 3. Create Sample Refund Ledger Records
  const sampleRefunds = [
    {
      orderIndex: 0,
      returnIndex: 4, // refunded return
      amount: 14500,
      reason: "Wrong product received - Returned to warehouse",
      method: "card",
      status: "completed",
      external_ref: "STRIPE_REF_8921829",
      daysAgo: 7
    },
    {
      orderIndex: 1,
      returnIndex: 5, // refunded return
      amount: 18900,
      reason: "Factory defect in air cushion",
      method: "wallet",
      status: "completed",
      external_ref: "BANK_IBFT_9021941",
      daysAgo: 11
    },
    {
      orderIndex: 2,
      returnIndex: null,
      amount: 12000,
      reason: "Customer cancelled COD drop before courier dispatch",
      method: "cod",
      status: "completed",
      external_ref: "CASH_REVERT_39102",
      daysAgo: 3
    },
    {
      orderIndex: 3,
      returnIndex: null,
      amount: 9800,
      reason: "Partial refund for late courier delivery compensation",
      method: "card",
      status: "pending",
      external_ref: null,
      daysAgo: 1
    },
    {
      orderIndex: 4,
      returnIndex: null,
      amount: 22500,
      reason: "Customer payment gateway timeout reversal",
      method: "card",
      status: "failed",
      failure_reason: "Customer bank card expired or declined credit reversal",
      external_ref: "GATEWAY_TIMEOUT_FAIL",
      daysAgo: 4
    }
  ];

  for (const r of sampleRefunds) {
    const order = orders[r.orderIndex % orders.length];
    const returnReq = r.returnIndex !== null ? createdReturns[r.returnIndex] : null;
    const createdAt = new Date(Date.now() - r.daysAgo * 24 * 60 * 60 * 1000);
    const processedAt = r.status === 'completed' ? new Date(createdAt.getTime() + 3600000) : null;

    const ref = await prisma.refund.create({
      data: {
        id: uuidv4(),
        order_id: order.id,
        order_number: order.order_number,
        return_request_id: returnReq?.id || null,
        amount: r.amount,
        reason: r.reason,
        method: r.method,
        status: r.status,
        external_ref: r.external_ref,
        failure_reason: r.failure_reason || null,
        created_at: createdAt,
        processed_at: processedAt
      }
    });

    console.log(`Created refund #${ref.id.split('-')[0]} for Order ${order.order_number} [${ref.status}] - Rs ${ref.amount}`);
  }

  console.log("Successfully seeded returns & refunds testing data!");
}

seedReturnsAndRefunds()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
