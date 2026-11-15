const { PrismaClient } = require('@prisma/client');

async function syncLocalToSupabase() {
  const localDbUrl = 'postgresql://postgres:%40Bahadurkhan7@localhost:5432/sneakpk?schema=public';
  // Use direct connection URL for migrations/bulk sync to avoid transaction pooling limits
  const remoteDirectUrl = 'postgresql://postgres.mpfwfcudwgyydxjxkyso:%40Bahadurkhan7@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';

  console.log('Connecting to Local and Supabase databases...');
  const local = new PrismaClient({ datasources: { db: { url: localDbUrl } } });
  const remote = new PrismaClient({ datasources: { db: { url: remoteDirectUrl } } });

  try {
    // 1. SYNC ADMIN CREDENTIALS
    console.log('\n[1/7] Synchronizing Admin Account...');
    const localAdmin = await local.user.findUnique({ where: { email: 'sahilwaheed48@gmail.com' } });
    if (localAdmin) {
      await remote.user.upsert({
        where: { email: 'sahilwaheed48@gmail.com' },
        update: {
          name: localAdmin.name,
          role: 'admin',
          password_hash: localAdmin.password_hash,
          is_blocked: false,
        },
        create: {
          id: localAdmin.id,
          name: localAdmin.name,
          email: localAdmin.email,
          role: 'admin',
          password_hash: localAdmin.password_hash,
          is_blocked: false,
        }
      });
      console.log('✔ Admin account sahilwaheed48@gmail.com synced with local credentials');
    }

    // 2. SYNC CATEGORIES
    console.log('\n[2/7] Synchronizing Categories...');
    const localCategories = await local.category.findMany();
    for (const cat of localCategories) {
      await remote.category.upsert({
        where: { slug: cat.slug },
        update: {
          name: cat.name,
          description: cat.description,
          seo_title: cat.seo_title,
          seo_description: cat.seo_description,
          image_url: cat.image_url,
          hero_banner_url: cat.hero_banner_url,
          hero_video_url: cat.hero_video_url,
          sort_order: cat.sort_order,
          is_active: cat.is_active,
        },
        create: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          seo_title: cat.seo_title,
          seo_description: cat.seo_description,
          image_url: cat.image_url,
          hero_banner_url: cat.hero_banner_url,
          hero_video_url: cat.hero_video_url,
          sort_order: cat.sort_order,
          is_active: cat.is_active,
        }
      });
      console.log(`✔ Category synced: ${cat.name} (${cat.slug})`);
    }

    // 3. SYNC BRANDS
    console.log('\n[3/7] Synchronizing Brands...');
    const localBrands = await local.brand.findMany();
    for (const brand of localBrands) {
      await remote.brand.upsert({
        where: { slug: brand.slug },
        update: {
          name: brand.name,
          image_url: brand.image_url,
        },
        create: {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          image_url: brand.image_url,
        }
      });
      console.log(`✔ Brand synced: ${brand.name} (${brand.slug})`);
    }

    // 4. SYNC PRODUCTS & SIZES
    console.log('\n[4/7] Synchronizing Products and Size Matrices...');
    const localProducts = await local.product.findMany({ include: { sizes: true } });
    console.log(`Total local products to sync: ${localProducts.length}`);

    for (const p of localProducts) {
      // Check if product exists on remote by slug
      let remoteProduct = await remote.product.findUnique({ where: { slug: p.slug } });

      const productPayload = {
        name: p.name,
        base_price: p.base_price,
        cost_price: p.cost_price,
        compare_at_price: p.compare_at_price,
        flash_sale_price: p.flash_sale_price,
        description: p.description,
        category_slug: p.category_slug,
        brand_slug: p.brand_slug,
        images: p.images,
        hover_image: p.hover_image,
        is_new_arrival: p.is_new_arrival,
        is_best_seller: p.is_best_seller,
        is_flash_sale: p.is_flash_sale,
        is_featured: p.is_featured,
        status: p.status,
        avg_rating: p.avg_rating,
        review_count: p.review_count,
        sort_order: p.sort_order,
      };

      if (remoteProduct) {
        await remote.product.update({
          where: { id: remoteProduct.id },
          data: productPayload,
        });
      } else {
        remoteProduct = await remote.product.create({
          data: {
            id: p.id,
            slug: p.slug,
            ...productPayload,
          }
        });
      }

      // Sync sizes for this product
      // Delete existing sizes for this product on remote and recreate to ensure exact match
      await remote.productSize.deleteMany({
        where: { product_id: remoteProduct.id },
      });

      for (const s of p.sizes) {
        await remote.productSize.create({
          data: {
            product_id: remoteProduct.id,
            size: s.size,
            stock: s.stock,
          }
        });
      }

      console.log(`✔ Product synced: [${p.category_slug}] ${p.name} | Flash: ${p.is_flash_sale} | Images: ${p.images.length} | Sizes: ${p.sizes.length}`);
    }

    // Ensure any obsolete products on remote that are NOT in local are cleaned up or deactivated
    const remoteProductsAll = await remote.product.findMany({ select: { id: true, slug: true, name: true } });
    const localSlugs = new Set(localProducts.map(lp => lp.slug));
    for (const rp of remoteProductsAll) {
      if (!localSlugs.has(rp.slug)) {
        console.log(`⚠ Found product on remote not in local: ${rp.name} (${rp.slug}). Setting status to archived.`);
        await remote.product.update({
          where: { id: rp.id },
          data: { status: 'archived', is_flash_sale: false, is_featured: false, is_new_arrival: false }
        });
      }
    }

    // 5. SYNC SETTINGS
    console.log('\n[5/7] Synchronizing Store Settings...');
    const localSettings = await local.settings.findFirst();
    if (localSettings) {
      await remote.settings.upsert({
        where: { id: 'singleton' },
        update: {
          announcement_text: localSettings.announcement_text,
          announcement_active: localSettings.announcement_active,
          free_shipping_min_amt: localSettings.free_shipping_min_amt,
          flat_shipping_fee: localSettings.flat_shipping_fee,
          advance_payment_threshold: localSettings.advance_payment_threshold,
          advance_payment_percent: localSettings.advance_payment_percent,
          flash_sale_active: localSettings.flash_sale_active,
          flash_sale_end_time: localSettings.flash_sale_end_time,
          cod_enabled: localSettings.cod_enabled,
          card_enabled: localSettings.card_enabled,
          wallet_enabled: localSettings.wallet_enabled,
          whatsapp_number: localSettings.whatsapp_number,
          supported_countries: localSettings.supported_countries,
        },
        create: {
          id: 'singleton',
          announcement_text: localSettings.announcement_text,
          announcement_active: localSettings.announcement_active,
          free_shipping_min_amt: localSettings.free_shipping_min_amt,
          flat_shipping_fee: localSettings.flat_shipping_fee,
          advance_payment_threshold: localSettings.advance_payment_threshold,
          advance_payment_percent: localSettings.advance_payment_percent,
          flash_sale_active: localSettings.flash_sale_active,
          flash_sale_end_time: localSettings.flash_sale_end_time,
          cod_enabled: localSettings.cod_enabled,
          card_enabled: localSettings.card_enabled,
          wallet_enabled: localSettings.wallet_enabled,
          whatsapp_number: localSettings.whatsapp_number,
          supported_countries: localSettings.supported_countries,
        }
      });
      console.log('✔ Settings synced (Flash sale active until:', localSettings.flash_sale_end_time, ')');
    }

    // 6. SYNC HERO SLIDES
    console.log('\n[6/7] Synchronizing Hero Slides...');
    const localHeroSlides = await local.heroSlide.findMany();
    await remote.heroSlide.deleteMany();
    for (const hs of localHeroSlides) {
      await remote.heroSlide.create({
        data: {
          id: hs.id,
          title: hs.title,
          subtitle: hs.subtitle,
          image_url: hs.image_url,
          mobile_image_url: hs.mobile_image_url,
          link: hs.link,
          button_text: hs.button_text,
          is_active: hs.is_active,
          sort_order: hs.sort_order,
          start_date: hs.start_date,
          end_date: hs.end_date,
        }
      });
      console.log(`✔ Hero Slide synced: ${hs.title}`);
    }

    // 7. SYNC HOMEPAGE SECTIONS
    console.log('\n[7/7] Synchronizing Homepage Sections...');
    const localSections = await local.homepageSection.findMany();
    for (const sec of localSections) {
      await remote.homepageSection.upsert({
        where: { type: sec.type },
        update: {
          is_active: sec.is_active,
          sort_order: sec.sort_order,
          settings: sec.settings,
        },
        create: {
          id: sec.id,
          type: sec.type,
          is_active: sec.is_active,
          sort_order: sec.sort_order,
          settings: sec.settings,
        }
      });
      console.log(`✔ Section synced: ${sec.type}`);
    }

    console.log('\n=============================================');
    console.log('🎉 ALL DATA SUCCESSFULLY SYNCED TO SUPABASE!');
    console.log('=============================================');

    // Verification check
    const remoteFlashCount = await remote.product.count({ where: { is_flash_sale: true, status: 'active' } });
    const remoteActiveCount = await remote.product.count({ where: { status: 'active' } });
    const remoteSettingsVerify = await remote.settings.findFirst();

    console.log(`Remote Active Products: ${remoteActiveCount}`);
    console.log(`Remote Flash Sale Products: ${remoteFlashCount}`);
    console.log(`Remote Flash Sale Active: ${remoteSettingsVerify.flash_sale_active}`);
    console.log(`Remote Flash Sale End: ${remoteSettingsVerify.flash_sale_end_time}`);

  } catch (err) {
    console.error('❌ Sync failed with error:', err);
    process.exit(1);
  } finally {
    await local.$disconnect();
    await remote.$disconnect();
  }
}

syncLocalToSupabase();
