const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const localDbUrl = 'postgresql://postgres:%40Bahadurkhan7@localhost:5432/sneakpk?schema=public';
const remoteDirectUrl = 'postgresql://postgres.mpfwfcudwgyydxjxkyso:%40Bahadurkhan7@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';

const local = new PrismaClient({ datasources: { db: { url: localDbUrl } } });
const remote = new PrismaClient({ datasources: { db: { url: remoteDirectUrl } } });

const SAMPLE_CUSTOMERS = [
  { name: "Bilal Ahmed", phone: "03001234567", email: "bilal.ahmed@gmail.com", city: "Lahore", prov: "Punjab", addr: "House 42, Sector Y, DHA Phase 3" },
  { name: "Zainab Bibi", phone: "03218765432", email: "zainab.b@yahoo.com", city: "Karachi", prov: "Sindh", addr: "Flat 4B, Block 13-D, Gulshan-e-Iqbal" },
  { name: "Usman Ghani", phone: "03335551234", email: "usman.ghani@outlook.com", city: "Islamabad", prov: "Islamabad Capital", addr: "Street 19, Sector F-10/2" },
  { name: "Ayesha Khan", phone: "03459998877", email: "ayesha.k@gmail.com", city: "Rawalpindi", prov: "Punjab", addr: "Plot 104, Safari Villas 1, Bahria Town" },
  { name: "Farhan Saeed", phone: "03124443322", email: "farhan.s@gmail.com", city: "Faisalabad", prov: "Punjab", addr: "Main Boulevard, Kohinoor City" },
  { name: "Fatima Noor", phone: "03017776655", email: "fatima.noor@hotmail.com", city: "Peshawar", prov: "KPK", addr: "House 12, Phase 4, Hayatabad" },
  { name: "Saad Qureshi", phone: "03221112233", email: "saad.q@gmail.com", city: "Multan", prov: "Punjab", addr: "Officers Colony, Multan Cantt" },
  { name: "Maham Tariq", phone: "03348887766", email: "maham.tariq@gmail.com", city: "Sialkot", prov: "Punjab", addr: "Paris Road, Model Town" },
  { name: "Omer Sheikh", phone: "03135554433", email: "omer.sheikh@gmail.com", city: "Gujranwala", prov: "Punjab", addr: "DC Colony, Main Market" },
  { name: "Hassan Ali", phone: "03036665544", email: "hassan.ali@gmail.com", city: "Hyderabad", prov: "Sindh", addr: "Auto Bhan Road, Latifabad Unit 3" },
  { name: "Zubair Shah", phone: "03443332211", email: "zubair.shah@gmail.com", city: "Quetta", prov: "Balochistan", addr: "Jinnah Road, Near Serena" },
  { name: "Maryam Jameel", phone: "03239990011", email: "maryam.j@gmail.com", city: "Lahore", prov: "Punjab", addr: "Street 7, Sector C, Bahria Orchard" },
  { name: "Kamran Akmal", phone: "03112223344", email: "kamran.akmal@gmail.com", city: "Karachi", prov: "Sindh", addr: "Lane 5, Phase 6, DHA" },
  { name: "Sara Nadeem", phone: "03078889900", email: "sara.nadeem@gmail.com", city: "Islamabad", prov: "Islamabad Capital", addr: "House 28, Street 4, Sector G-11/3" },
  { name: "Waqas Butt", phone: "03314445566", email: "waqas.butt@gmail.com", city: "Lahore", prov: "Punjab", addr: "Main Market, Gulberg 2" }
];

const STATUSES = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const COURIERS = ['TCS', 'Leopards', 'Trax', 'PostEx'];

async function seedOrdersForDb(prisma, label) {
  console.log(`\nSeeding test orders for ${label}...`);
  const products = await prisma.product.findMany({
    where: { status: 'active' },
    include: { sizes: true }
  });

  if (products.length === 0) {
    console.log("No products found to create orders with.");
    return;
  }

  for (let i = 0; i < SAMPLE_CUSTOMERS.length; i++) {
    const cust = SAMPLE_CUSTOMERS[i];
    const status = STATUSES[i % STATUSES.length];
    const prod1 = products[i % products.length];
    const prod2 = products[(i + 3) % products.length];
    const p1Size = prod1.sizes[i % prod1.sizes.length]?.size || "42";
    const p2Size = prod2.sizes[(i + 1) % prod2.sizes.length]?.size || "43";

    const p1Price = prod1.is_flash_sale && prod1.flash_sale_price ? prod1.flash_sale_price : prod1.base_price;
    const p2Price = prod2.is_flash_sale && prod2.flash_sale_price ? prod2.flash_sale_price : prod2.base_price;

    const hasTwoItems = i % 2 === 0;
    const subtotal = hasTwoItems ? (p1Price + p2Price) : p1Price;
    const shipping_fee = subtotal >= 5000 ? 0 : 250;
    const total = subtotal + shipping_fee;

    const orderNumber = `PK-SNK-${Math.floor(10000 + Math.random() * 90000)}`;
    const isShippedOrDelivered = ['shipped', 'delivered'].includes(status);
    const courier = isShippedOrDelivered ? COURIERS[i % COURIERS.length] : null;
    const tracking = isShippedOrDelivered ? `${courier}-${Math.floor(1000000 + Math.random() * 9000000)}` : null;

    const itemsData = [
      {
        id: uuidv4(),
        product_id: prod1.id,
        product_name: prod1.name,
        variant_label: `Size ${p1Size}`,
        size: String(p1Size),
        image_url: prod1.images?.[0] || '',
        unit_price: p1Price,
        quantity: 1
      }
    ];

    if (hasTwoItems) {
      itemsData.push({
        id: uuidv4(),
        product_id: prod2.id,
        product_name: prod2.name,
        variant_label: `Size ${p2Size}`,
        size: String(p2Size),
        image_url: prod2.images?.[0] || '',
        unit_price: p2Price,
        quantity: 1
      });
    }

    const histories = [
      { id: uuidv4(), status: 'placed', note: 'Customer placed order online', at: new Date(Date.now() - (15 - i) * 86400000) }
    ];
    if (status !== 'placed') {
      histories.push({ id: uuidv4(), status: 'confirmed', note: 'Payment & inventory verified', at: new Date(Date.now() - (14 - i) * 86400000) });
    }
    if (['processing', 'shipped', 'delivered'].includes(status)) {
      histories.push({ id: uuidv4(), status: 'processing', note: 'Packed at warehouse', at: new Date(Date.now() - (13 - i) * 86400000) });
    }
    if (['shipped', 'delivered'].includes(status)) {
      histories.push({ id: uuidv4(), status: 'shipped', note: `Handed over to ${courier}. AWB: ${tracking}`, at: new Date(Date.now() - (12 - i) * 86400000) });
    }
    if (status === 'delivered') {
      histories.push({ id: uuidv4(), status: 'delivered', note: 'Rider confirmed delivery & COD collected', at: new Date(Date.now() - (10 - i) * 86400000) });
    }
    if (status === 'cancelled') {
      histories.push({ id: uuidv4(), status: 'cancelled', note: 'Customer requested cancellation prior to dispatch', at: new Date(Date.now() - (13 - i) * 86400000) });
    }

    await prisma.order.create({
      data: {
        id: uuidv4(),
        order_number: orderNumber,
        customer_name: cust.name,
        customer_phone: cust.phone,
        customer_email: cust.email,
        shipping_address: {
          address_l1: cust.addr,
          city: cust.city,
          province: cust.prov,
          country_code: "PK"
        },
        subtotal,
        shipping_fee,
        discount_amount: 0,
        total,
        payment_method: i % 4 === 0 ? "Card" : "COD",
        payment_status: status === 'delivered' || i % 4 === 0 ? 'paid' : 'pending',
        status: status,
        courier_name: courier,
        tracking_number: tracking,
        customer_note: i % 3 === 0 ? "Please call before delivery" : null,
        created_at: new Date(Date.now() - (15 - i) * 86400000 + i * 3600000),
        items: { create: itemsData },
        status_history: { create: histories }
      }
    });

    console.log(`✔ Created #${orderNumber} (${status}) for ${cust.name} - Rs. ${total.toLocaleString()}`);
  }
}

async function main() {
  await seedOrdersForDb(local, 'LOCAL DB');
  await seedOrdersForDb(remote, 'REMOTE SUPABASE DB');

  try {
    const memoryCache = require('../src/utils/cache');
    memoryCache.flush();
  } catch (_) {}

  await local.$disconnect();
  await remote.$disconnect();
  console.log('\n🎉 Finished seeding 15 realistic orders across both databases!');
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});

