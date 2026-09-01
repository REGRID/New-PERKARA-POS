import prisma from "@/lib/prisma";

const db = prisma as any;

export async function seedOfficialPerkaraData(forceReset = false) {
  try {
    const ingModel = db.ingredient || db.Ingredient;
    const catModel = db.customCategory || db.CustomCategory || db.category;
    const menuModel = db.menu || db.Menu;
    const recipeModel = db.recipeItem || db.RecipeItem;
    const addonCatModel = db.addonCategory || db.AddonCategory;
    const addonItemModel = db.addonItem || db.AddonItem;
    const addonRecipeModel = db.addonRecipe || db.AddonRecipe;

    if (!ingModel || !menuModel) {
      console.warn("Prisma models not ready for seeding");
      return { success: false };
    }

    console.log("Starting Official Perkara Coffee Seeding...");

    // =========================================================================
    // 1. MASTER BAHAN BAKU (INGREDIENTS) DENGAN STANDAR KONVERSI HPP
    // =========================================================================
    const rawMaterials = [
      {
        sku: "ING-COFFEE-01",
        name: "Biji Kopi Espresso (House Blend)",
        category: "Bahan Baku",
        buyUnit: "Kg",
        unit: "gram",
        conversionRatio: 1000,
        floorQuantity: 5000,
        minStockAlert: 500,
        hargaBeli: 180000,
        costPerUseUnit: 180, // Rp 180 per gram (Double shot 18g = Rp 3.240)
      },
      {
        sku: "ING-COLDBREW-01",
        name: "Konsentrat Cold Brew Fermentasi",
        category: "Bahan Baku",
        buyUnit: "Liter",
        unit: "ml",
        conversionRatio: 1000,
        floorQuantity: 10000,
        minStockAlert: 1000,
        hargaBeli: 40000,
        costPerUseUnit: 40, // Rp 40 per ml (150ml = Rp 6.000)
      },
      {
        sku: "ING-MILK-01",
        name: "Susu Segar (Fresh Milk Pasteurisasi)",
        category: "Bahan Baku",
        buyUnit: "Liter",
        unit: "ml",
        conversionRatio: 1000,
        floorQuantity: 20000,
        minStockAlert: 2000,
        hargaBeli: 18000,
        costPerUseUnit: 18, // Rp 18 per ml (75ml = Rp 1.350)
      },
      {
        sku: "ING-CREAMER-01",
        name: "Creamer Bubuk Premium",
        category: "Bahan Baku",
        buyUnit: "Kg",
        unit: "gram",
        conversionRatio: 1000,
        floorQuantity: 5000,
        minStockAlert: 500,
        hargaBeli: 45000,
        costPerUseUnit: 45, // Rp 45 per gram (8g = Rp 360)
      },
      {
        sku: "ING-AREN-01",
        name: "Gula Aren Cair Organik",
        category: "Bahan Baku",
        buyUnit: "Liter",
        unit: "ml",
        conversionRatio: 1000,
        floorQuantity: 5000,
        minStockAlert: 500,
        hargaBeli: 35000,
        costPerUseUnit: 35, // Rp 35 per ml (15ml / 1 pump = Rp 525)
      },
      {
        sku: "ING-SYRUP-SUGAR",
        name: "Simple Syrup (Gula Cair Murni)",
        category: "Bahan Baku",
        buyUnit: "Liter",
        unit: "ml",
        conversionRatio: 1000,
        floorQuantity: 5000,
        minStockAlert: 500,
        hargaBeli: 20000,
        costPerUseUnit: 20, // Rp 20 per ml (8ml = Rp 160)
      },
      {
        sku: "ING-SYRUP-BUTTER",
        name: "Syrup Butterscotch Artisan",
        category: "Bahan Baku",
        buyUnit: "Botol 750ml",
        unit: "ml",
        conversionRatio: 750,
        floorQuantity: 2250,
        minStockAlert: 250,
        hargaBeli: 120000,
        costPerUseUnit: 160, // Rp 160 per ml (15ml / 1 pump = Rp 2.400)
      },
      {
        sku: "ING-SYRUP-HAZEL",
        name: "Syrup Hazelnut Roasted",
        category: "Bahan Baku",
        buyUnit: "Botol 750ml",
        unit: "ml",
        conversionRatio: 750,
        floorQuantity: 2250,
        minStockAlert: 250,
        hargaBeli: 120000,
        costPerUseUnit: 160,
      },
      {
        sku: "ING-SYRUP-CARAMEL",
        name: "Syrup Salted Caramel Signature",
        category: "Bahan Baku",
        buyUnit: "Botol 750ml",
        unit: "ml",
        conversionRatio: 750,
        floorQuantity: 2250,
        minStockAlert: 250,
        hargaBeli: 120000,
        costPerUseUnit: 160,
      },
      {
        sku: "ING-SYRUP-RUM",
        name: "Syrup Roun (Rum Flavour Halal)",
        category: "Bahan Baku",
        buyUnit: "Botol 750ml",
        unit: "ml",
        conversionRatio: 750,
        floorQuantity: 2250,
        minStockAlert: 250,
        hargaBeli: 130000,
        costPerUseUnit: 173.33,
      },
      {
        sku: "ING-SYRUP-IRISH",
        name: "Syrup Irish Cream (Aires)",
        category: "Bahan Baku",
        buyUnit: "Botol 750ml",
        unit: "ml",
        conversionRatio: 750,
        floorQuantity: 2250,
        minStockAlert: 250,
        hargaBeli: 130000,
        costPerUseUnit: 173.33,
      },
      {
        sku: "ING-SYRUP-POPCORN",
        name: "Syrup Popcorn Sweet & Savory",
        category: "Bahan Baku",
        buyUnit: "Botol 750ml",
        unit: "ml",
        conversionRatio: 750,
        floorQuantity: 2250,
        minStockAlert: 250,
        hargaBeli: 120000,
        costPerUseUnit: 160,
      },
      {
        sku: "ING-SYRUP-PISTACHIO",
        name: "Syrup Pistachio Nutty",
        category: "Bahan Baku",
        buyUnit: "Botol 750ml",
        unit: "ml",
        conversionRatio: 750,
        floorQuantity: 2250,
        minStockAlert: 250,
        hargaBeli: 140000,
        costPerUseUnit: 186.67,
      },
      {
        sku: "ING-SYRUP-CRANBERRY",
        name: "Syrup Cranberry Fruity",
        category: "Bahan Baku",
        buyUnit: "Botol 750ml",
        unit: "ml",
        conversionRatio: 750,
        floorQuantity: 2250,
        minStockAlert: 250,
        hargaBeli: 110000,
        costPerUseUnit: 146.67,
      },
      {
        sku: "ING-POWDER-CHOCO",
        name: "Powder Dark Chocolate Murni",
        category: "Bahan Baku",
        buyUnit: "Kg",
        unit: "gram",
        conversionRatio: 1000,
        floorQuantity: 3000,
        minStockAlert: 300,
        hargaBeli: 90000,
        costPerUseUnit: 90, // Rp 90 per gram (20g = Rp 1.800)
      },
      {
        sku: "ING-POWDER-MATCHA",
        name: "Powder Pure Japanese Matcha",
        category: "Bahan Baku",
        buyUnit: "Kg",
        unit: "gram",
        conversionRatio: 1000,
        floorQuantity: 3000,
        minStockAlert: 300,
        hargaBeli: 130000,
        costPerUseUnit: 130, // Rp 130 per gram (20g = Rp 2.600)
      },
      {
        sku: "ING-POWDER-GREENTEA",
        name: "Powder Authentic Greentea",
        category: "Bahan Baku",
        buyUnit: "Kg",
        unit: "gram",
        conversionRatio: 1000,
        floorQuantity: 3000,
        minStockAlert: 300,
        hargaBeli: 90000,
        costPerUseUnit: 90,
      },
      {
        sku: "ING-POWDER-REDVELVET",
        name: "Powder Red Velvet Artisan",
        category: "Bahan Baku",
        buyUnit: "Kg",
        unit: "gram",
        conversionRatio: 1000,
        floorQuantity: 3000,
        minStockAlert: 300,
        hargaBeli: 95000,
        costPerUseUnit: 95,
      },
      {
        sku: "ING-POWDER-TARO",
        name: "Powder Taro Creamy Ungu",
        category: "Bahan Baku",
        buyUnit: "Kg",
        unit: "gram",
        conversionRatio: 1000,
        floorQuantity: 3000,
        minStockAlert: 300,
        hargaBeli: 90000,
        costPerUseUnit: 90,
      },
      {
        sku: "ING-POWDER-CHARCOAL",
        name: "Powder Charcoal / Black Sugar",
        category: "Bahan Baku",
        buyUnit: "Kg",
        unit: "gram",
        conversionRatio: 1000,
        floorQuantity: 3000,
        minStockAlert: 300,
        hargaBeli: 110000,
        costPerUseUnit: 110,
      },
      {
        sku: "ING-POWDER-COOKIES",
        name: "Powder Cookies & Cream Blend",
        category: "Bahan Baku",
        buyUnit: "Kg",
        unit: "gram",
        conversionRatio: 1000,
        floorQuantity: 3000,
        minStockAlert: 300,
        hargaBeli: 100000,
        costPerUseUnit: 100,
      },
      {
        sku: "ING-ICE-01",
        name: "Es Batu Kristal Higienis",
        category: "Bahan Baku",
        buyUnit: "Bal (10 Kg)",
        unit: "gram",
        conversionRatio: 10000,
        floorQuantity: 50000,
        minStockAlert: 5000,
        hargaBeli: 15000,
        costPerUseUnit: 1.5, // Rp 1.5 per gram (100g = Rp 150)
      },
      {
        sku: "PKG-CUP-16OZ",
        name: "Cup & Lid Perkara 16oz + Sedotan",
        category: "Kemasan",
        buyUnit: "Dus (500 pcs)",
        unit: "pcs",
        conversionRatio: 500,
        floorQuantity: 1000,
        minStockAlert: 100,
        hargaBeli: 325000,
        costPerUseUnit: 650, // Rp 650 per set
        isPackaging: true,
      },
    ];

    const ingredientMap: { [sku: string]: string } = {};

    for (const mat of rawMaterials) {
      let existing = await ingModel.findFirst({
        where: {
          OR: [{ sku: mat.sku }, { name: mat.name }],
        },
      });

      if (existing) {
        existing = await ingModel.update({
          where: { id: existing.id },
          data: {
            ...mat,
            floorQuantity: forceReset ? mat.floorQuantity : existing.floorQuantity,
          },
        });
      } else {
        existing = await ingModel.create({ data: mat });
      }
      ingredientMap[mat.sku] = existing.id;
    }

    console.log("Master Ingredients Seeded Successfully:", Object.keys(ingredientMap).length);

    // =========================================================================
    // 2. ADDON GROUPS (VARIAN BASE PURE/LATTE & SUGAR LEVEL)
    // =========================================================================
    if (addonCatModel && addonItemModel) {
      // Grup 1: Pilihan Base (Wajib untuk Non-Coffee)
      let baseCat = await addonCatModel.findFirst({ where: { name: "Pilihan Base (Non-Coffee)" } });
      if (!baseCat) {
        baseCat = await addonCatModel.create({
          data: {
            name: "Pilihan Base (Non-Coffee)",
            isRequired: true,
            allowMultiple: false,
          },
        });
      }

      // Addon Items for Base
      const baseItems = [
        {
          name: "Pure (Water & Creamer)",
          price: 0,
          addonCategoryId: baseCat.id,
          recipe: [{ ingredientSku: "ING-CREAMER-01", qty: 8 }],
        },
        {
          name: "Latte (Fresh Milk Base)",
          price: 0,
          addonCategoryId: baseCat.id,
          recipe: [
            { ingredientSku: "ING-MILK-01", qty: 75 },
            { ingredientSku: "ING-CREAMER-01", qty: 5 },
          ],
        },
      ];

      for (const bi of baseItems) {
        let existingItem = await addonItemModel.findFirst({
          where: { addonCategoryId: baseCat.id, name: bi.name },
        });
        if (!existingItem) {
          existingItem = await addonItemModel.create({
            data: {
              name: bi.name,
              price: bi.price,
              addonCategoryId: bi.addonCategoryId,
            },
          });
        }

        // Addon Recipe linking
        if (addonRecipeModel && bi.recipe) {
          await addonRecipeModel.deleteMany({ where: { addonItemId: existingItem.id } }).catch(() => null);
          for (const rc of bi.recipe) {
            const ingId = ingredientMap[rc.ingredientSku];
            if (ingId) {
              await addonRecipeModel.create({
                data: {
                  addonItemId: existingItem.id,
                  ingredientId: ingId,
                  quantityUsed: rc.qty,
                },
              });
            }
          }
        }
      }

      // Grup 2: Sugar Level
      let sugarCat = await addonCatModel.findFirst({ where: { name: "Tingkat Kemanisan (Sugar Level)" } });
      if (!sugarCat) {
        sugarCat = await addonCatModel.create({
          data: {
            name: "Tingkat Kemanisan (Sugar Level)",
            isRequired: true,
            allowMultiple: false,
          },
        });
      }

      const sugarItems = [
        {
          name: "Normal Sugar (100%)",
          price: 0,
          addonCategoryId: sugarCat.id,
          recipe: [{ ingredientSku: "ING-SYRUP-SUGAR", qty: 8 }],
        },
        {
          name: "Less Sugar (50%)",
          price: 0,
          addonCategoryId: sugarCat.id,
          recipe: [{ ingredientSku: "ING-SYRUP-SUGAR", qty: 4 }],
        },
        {
          name: "No Sugar (0%)",
          price: 0,
          addonCategoryId: sugarCat.id,
          recipe: [],
        },
      ];

      for (const si of sugarItems) {
        let existingSugar = await addonItemModel.findFirst({
          where: { addonCategoryId: sugarCat.id, name: si.name },
        });
        if (!existingSugar) {
          existingSugar = await addonItemModel.create({
            data: {
              name: si.name,
              price: si.price,
              addonCategoryId: si.addonCategoryId,
            },
          });
        }
        if (addonRecipeModel && si.recipe && si.recipe.length > 0) {
          await addonRecipeModel.deleteMany({ where: { addonItemId: existingSugar.id } }).catch(() => null);
          for (const rc of si.recipe) {
            const ingId = ingredientMap[rc.ingredientSku];
            if (ingId) {
              await addonRecipeModel.create({
                data: {
                  addonItemId: existingSugar.id,
                  ingredientId: ingId,
                  quantityUsed: rc.qty,
                },
              });
            }
          }
        }
      }

      // Grup 3: Ekstra Topping
      let toppingCat = await addonCatModel.findFirst({ where: { name: "Ekstra Topping & Shot" } });
      if (!toppingCat) {
        toppingCat = await addonCatModel.create({
          data: {
            name: "Ekstra Topping & Shot",
            isRequired: false,
            allowMultiple: true,
          },
        });
      }

      const toppingItems = [
        { name: "Extra Espresso Shot (+18g)", price: 5000, addonCategoryId: toppingCat.id },
        { name: "Extra Gula Aren (+15ml)", price: 3000, addonCategoryId: toppingCat.id },
        { name: "Extra Syrup Flavor (+15ml)", price: 4000, addonCategoryId: toppingCat.id },
        { name: "Ice Cream Vanilla Scoop", price: 5000, addonCategoryId: toppingCat.id },
      ];

      for (const ti of toppingItems) {
        let existingTopping = await addonItemModel.findFirst({
          where: { addonCategoryId: toppingCat.id, name: ti.name },
        });
        if (!existingTopping) {
          await addonItemModel.create({
            data: {
              name: ti.name,
              price: ti.price,
              addonCategoryId: ti.addonCategoryId,
            },
          });
        }
      }
    }

    // =========================================================================
    // 3. DAFTAR MENU RESMI PERKARA COFFEE & RESEP DETAIL
    // =========================================================================
    const officialMenus = [
      // A. COFFEE SECTION
      {
        sku: "MENU-COF-01",
        name: "Kopi Sabis (Saksi Bisu)",
        category: "Menu Kopi",
        price: 22000,
        ops: JSON.stringify({
          standar: "Cold Brew",
          makna: "Mengenang gedung dan benda bersejarah yang menyaksikan perjuangan kemerdekaan.",
          filosofi: "Diekstraksi secara diam-diam (silent) dan perlahan dalam waktu 12 jam, menghasilkan rasa yang halus, manis alami, dan sangat aman di lambung.",
        }),
        recipes: [
          { sku: "ING-COLDBREW-01", qty: 150 }, // 150ml Cold Brew
          { sku: "ING-COFFEE-01", qty: 5 },     // 10ml Espresso equivalent (~5g biji)
          { sku: "ING-ICE-01", qty: 100 },      // 100g Es Kristal
          { sku: "PKG-CUP-16OZ", qty: 1 },      // 1 Cup
        ],
      },
      {
        sku: "MENU-COF-02",
        name: "Ampera",
        category: "Menu Kopi",
        price: 18000,
        ops: JSON.stringify({
          standar: "Americano",
          makna: "Americano Perjuangan Rakyat (Mengenang semangat Tritura).",
          filosofi: "Rasanya yang pekat, kuat, dan pahit di awal mewakili perjuangan keras, namun menjadi wake-up call (kesadaran) yang menyegarkan bagi siapa saja yang meminumnya.",
        }),
        recipes: [
          { sku: "ING-COFFEE-01", qty: 18 }, // 18g Biji Kopi (50ml Espresso)
          { sku: "ING-ICE-01", qty: 100 },
          { sku: "PKG-CUP-16OZ", qty: 1 },
        ],
      },
      {
        sku: "MENU-COF-03",
        name: "Kopi Arek",
        category: "Menu Kopi",
        price: 20000,
        ops: JSON.stringify({
          standar: "Kopi Susu Gula Aren",
          makna: "Arek Suroboyo (Mengenang keberanian Arek-arek Suroboyo mempertahankan kemerdekaan).",
          filosofi: "Rasa manis gula aren lokal yang khas mempresentasikan kebanggaan nusantara yang membakar semangat.",
        }),
        recipes: [
          { sku: "ING-COFFEE-01", qty: 18 },  // 18g Espresso
          { sku: "ING-MILK-01", qty: 75 },    // 75ml Fresh Milk
          { sku: "ING-CREAMER-01", qty: 8 },  // 8g Creamer
          { sku: "ING-AREN-01", qty: 20 },    // 20ml Gula Aren (1 Pump)
          { sku: "ING-ICE-01", qty: 100 },
          { sku: "PKG-CUP-16OZ", qty: 1 },
        ],
      },
      {
        sku: "MENU-COF-04",
        name: "Kopi Linggar",
        category: "Menu Kopi",
        price: 22000,
        ops: JSON.stringify({
          standar: "Kopi Susu Butterscotch",
          makna: "Linggarjati Butterscotch (Mengenang diplomasi halus di Perjanjian Linggarjati).",
          filosofi: "Butterscotch yang mewah, manis, dan buttery mewakili taktik diplomasi yang halus namun meninggalkan kesan mendalam dalam sejarah.",
        }),
        recipes: [
          { sku: "ING-COFFEE-01", qty: 18 },
          { sku: "ING-MILK-01", qty: 75 },
          { sku: "ING-CREAMER-01", qty: 8 },
          { sku: "ING-SYRUP-BUTTER", qty: 15 }, // 15ml Syrup Butterscotch
          { sku: "ING-SYRUP-SUGAR", qty: 8 },   // 8ml Gula
          { sku: "ING-ICE-01", qty: 100 },
          { sku: "PKG-CUP-16OZ", qty: 1 },
        ],
      },
      {
        sku: "MENU-COF-05",
        name: "Kopi Sapa",
        category: "Menu Kopi",
        price: 22000,
        ops: JSON.stringify({
          standar: "Kopi Susu Hazelnut",
          makna: "Sumpah Palapa (Mengenang sumpah persatuan Nusantara oleh Mahapatih Gajah Mada).",
          filosofi: "Rasa hazelnut (kacang-kacangan) yang earthy sangat pas menggambarkan sumpah yang mengakar kuat pada bumi nusantara.",
        }),
        recipes: [
          { sku: "ING-COFFEE-01", qty: 18 },
          { sku: "ING-MILK-01", qty: 75 },
          { sku: "ING-CREAMER-01", qty: 8 },
          { sku: "ING-SYRUP-HAZEL", qty: 15 },
          { sku: "ING-SYRUP-SUGAR", qty: 8 },
          { sku: "ING-ICE-01", qty: 100 },
          { sku: "PKG-CUP-16OZ", qty: 1 },
        ],
      },
      {
        sku: "MENU-COF-06",
        name: "Kopi Deja",
        category: "Menu Kopi",
        price: 22000,
        ops: JSON.stringify({
          standar: "Kopi Susu Salted Caramel",
          makna: "Deklarasi Djuanda (Mengenang penyatuan wilayah laut kedaulatan maritim Indonesia 1957).",
          filosofi: "Rasa asin (salted) mewakili lautan Nusantara yang luas, berpadu dengan manisnya karamel sebagai simbol kemenangan maritim kita.",
        }),
        recipes: [
          { sku: "ING-COFFEE-01", qty: 18 },
          { sku: "ING-MILK-01", qty: 75 },
          { sku: "ING-CREAMER-01", qty: 8 },
          { sku: "ING-SYRUP-CARAMEL", qty: 13 }, // 13ml Salted Caramel
          { sku: "ING-SYRUP-SUGAR", qty: 8 },
          { sku: "ING-ICE-01", qty: 100 },
          { sku: "PKG-CUP-16OZ", qty: 1 },
        ],
      },
      {
        sku: "MENU-COF-07",
        name: "Kopi Duta",
        category: "Menu Kopi",
        price: 22000,
        ops: JSON.stringify({
          standar: "Flat White Kopi Susu",
          makna: "Dwi Tunggal (Mengenang julukan Proklamator Soekarno dan Mohammad Hatta).",
          filosofi: "Seperti kopi dan susu, keduanya memiliki karakter kontras—hitam dan putih. Namun ketika disatukan tanpa pemanis berlebih, menciptakan fondasi sejarah yang abadi.",
        }),
        recipes: [
          { sku: "ING-COFFEE-01", qty: 22 }, // Extra bold espresso (50ml)
          { sku: "ING-MILK-01", qty: 100 },
          { sku: "ING-CREAMER-01", qty: 8 },
          { sku: "ING-ICE-01", qty: 100 },
          { sku: "PKG-CUP-16OZ", qty: 1 },
        ],
      },
      {
        sku: "MENU-COF-08",
        name: "Kopi Perkara",
        category: "Menu Kopi",
        price: 23000,
        ops: JSON.stringify({
          standar: "Kopi Susu Rum (100% Halal)",
          makna: "Pasal Karet Rakyat (Menu ini adalah biang keladinya!).",
          filosofi: "Diadopsi dari realita hukum kita yang kerap memunculkan 'Pasal Karet'—regulasi multi-tafsir yang selalu jadi biang perkara. Sensasi perisa rum di dalamnya memberikan kick yang menyindir tajam para elit yang sering 'mabuk kekuasaan'.",
        }),
        recipes: [
          { sku: "ING-COFFEE-01", qty: 18 },
          { sku: "ING-MILK-01", qty: 75 },
          { sku: "ING-CREAMER-01", qty: 8 },
          { sku: "ING-SYRUP-RUM", qty: 15 },
          { sku: "ING-SYRUP-SUGAR", qty: 8 },
          { sku: "ING-ICE-01", qty: 100 },
          { sku: "PKG-CUP-16OZ", qty: 1 },
        ],
      },
      {
        sku: "MENU-COF-09",
        name: "Kopi Aires",
        category: "Menu Kopi",
        price: 23000,
        ops: JSON.stringify({
          standar: "Kopi Susu Irish Cream",
          makna: "Angin Rencana Sembilan-belas-juta.",
          filosofi: "Sirup Irish Cream memberikan sensasi rasa mewah dan eksklusif—persis semanis janji penciptaan 19 juta lapangan kerja, namun pada akhirnya berlalu menjadi angin lalu saat dihadapkan pada realita mencari kerja.",
        }),
        recipes: [
          { sku: "ING-COFFEE-01", qty: 18 },
          { sku: "ING-MILK-01", qty: 75 },
          { sku: "ING-CREAMER-01", qty: 8 },
          { sku: "ING-SYRUP-IRISH", qty: 15 },
          { sku: "ING-SYRUP-SUGAR", qty: 8 },
          { sku: "ING-ICE-01", qty: 100 },
          { sku: "PKG-CUP-16OZ", qty: 1 },
        ],
      },
      {
        sku: "MENU-COF-10",
        name: "Populis",
        category: "Menu Kopi",
        price: 23000,
        ops: JSON.stringify({
          standar: "Popcorn Latte",
          makna: "Politik Pura-pura Peduli Sosial / Popcorn Latte.",
          filosofi: "Popcorn adalah cemilan saat kita menonton film di bioskop. Didedikasikan sebagai teman setia rakyat yang sedang menonton drama sandiwara elite politik dan janji-janji populis menjelang pemilu.",
        }),
        recipes: [
          { sku: "ING-COFFEE-01", qty: 18 },
          { sku: "ING-MILK-01", qty: 75 },
          { sku: "ING-CREAMER-01", qty: 8 },
          { sku: "ING-SYRUP-POPCORN", qty: 15 },
          { sku: "ING-ICE-01", qty: 100 },
          { sku: "PKG-CUP-16OZ", qty: 1 },
        ],
      },

      // B. NON-COFFEE SECTION (PILIHAN BASE PURE / LATTE VIA ADD-ON)
      {
        sku: "MENU-NON-01",
        name: "Coger",
        category: "Menu Non Kopi",
        price: 20000,
        ops: JSON.stringify({
          standar: "Chocolate (Cokelat Gerilya)",
          makna: "Mengenang taktik perang hutan Jenderal Sudirman.",
          filosofi: "Mengingatkan pada perjalanan masuk keluar hutan yang gelap (cokelat pekat), namun pada akhirnya memberikan kenyamanan yang manis bagi rakyat.",
        }),
        recipes: [
          { sku: "ING-POWDER-CHOCO", qty: 20 }, // 20g Powder Cokelat
          { sku: "ING-ICE-01", qty: 100 },
          { sku: "PKG-CUP-16OZ", qty: 1 },
        ],
      },
      {
        sku: "MENU-NON-02",
        name: "Mapeta",
        category: "Menu Non Kopi",
        price: 22000,
        ops: JSON.stringify({
          standar: "Matcha Pembela Tanah Air",
          makna: "Mengenang satuan tentara PETA yang berbaju hijau.",
          filosofi: "Warna hijau pekat matcha secara visual identik dengan seragam tentara PETA (Pembela Tanah Air) zaman pra-kemerdekaan. Penuh energi dan ketenangan.",
        }),
        recipes: [
          { sku: "ING-POWDER-MATCHA", qty: 20 },
          { sku: "ING-ICE-01", qty: 100 },
          { sku: "PKG-CUP-16OZ", qty: 1 },
        ],
      },
      {
        sku: "MENU-NON-03",
        name: "Tezam",
        category: "Menu Non Kopi",
        price: 20000,
        ops: JSON.stringify({
          standar: "Teh Zamrud (Authentic Greentea)",
          makna: "Mengenang julukan Indonesia sebagai Zamrud Khatulistiwa.",
          filosofi: "Rasa greentea yang lebih ringan dan harum mewakili kekayaan alam dan rempah Nusantara yang hijau membentang.",
        }),
        recipes: [
          { sku: "ING-POWDER-GREENTEA", qty: 20 },
          { sku: "ING-ICE-01", qty: 100 },
          { sku: "PKG-CUP-16OZ", qty: 1 },
        ],
      },
      {
        sku: "MENU-NON-04",
        name: "Revamato",
        category: "Menu Non Kopi",
        price: 20000,
        ops: JSON.stringify({
          standar: "Red Velvet Yamato",
          makna: "Mengenang aksi perobekan bendera biru di Hotel Yamato Surabaya.",
          filosofi: "Warna merah terang dari Red Velvet menjadi simbol keberanian dan pengorbanan darah para pahlawan untuk mengibarkan sang Merah Putih.",
        }),
        recipes: [
          { sku: "ING-POWDER-REDVELVET", qty: 20 },
          { sku: "ING-ICE-01", qty: 100 },
          { sku: "PKG-CUP-16OZ", qty: 1 },
        ],
      },
      {
        sku: "MENU-NON-05",
        name: "Taro",
        category: "Menu Non Kopi",
        price: 20000,
        ops: JSON.stringify({
          standar: "Taruhan Rupiah Oleng (Taro Creamy)",
          makna: "Pelipur lara saat melihat realita nilai tukar Rupiah yang semakin melemah dihantam naiknya Dolar.",
          filosofi: "Warna ungu taro yang kalem sengaja dihadirkan sebagai obat penenang visual saat denyut nadi rakyat 'oleng' melihat inflasi.",
        }),
        recipes: [
          { sku: "ING-POWDER-TARO", qty: 20 },
          { sku: "ING-ICE-01", qty: 100 },
          { sku: "PKG-CUP-16OZ", qty: 1 },
        ],
      },
      {
        sku: "MENU-NON-06",
        name: "Carkol",
        category: "Menu Non Kopi",
        price: 20000,
        ops: JSON.stringify({
          standar: "Charcoal / Black Sugar (Catatan Rancu Kebijakan Oligarki)",
          makna: "Minuman charcoal sehitam transparansi rancangan undang-undang yang tiba-tiba disahkan tengah malam.",
          filosofi: "Teksturnya yang sedikit gritty (berpasir) adalah bentuk protes halus terhadap proyek aspal dadakan yang langsung rusak satu bulan setelah pejabat selesai blusukan.",
        }),
        recipes: [
          { sku: "ING-POWDER-CHARCOAL", qty: 20 },
          { sku: "ING-ICE-01", qty: 100 },
          { sku: "PKG-CUP-16OZ", qty: 1 },
        ],
      },
      {
        sku: "MENU-NON-07",
        name: "Korum",
        category: "Menu Non Kopi",
        price: 22000,
        ops: JSON.stringify({
          standar: "Cookies n' Cream (Cookies Remahan Untuk Masyarakat)",
          makna: "Menggambarkan drama 'bagi-bagi kursi' kaum elit.",
          filosofi: "Kenikmatan cream tebal yang lembut adalah porsi utama para elit, sementara taburan pecahan cookies melambangkan masyarakat yang hanya kebagian remahan bansos dan janji manis kampanye.",
        }),
        recipes: [
          { sku: "ING-POWDER-COOKIES", qty: 20 },
          { sku: "ING-MILK-01", qty: 75 },
          { sku: "ING-CREAMER-01", qty: 5 },
          { sku: "ING-ICE-01", qty: 100 },
          { sku: "PKG-CUP-16OZ", qty: 1 },
        ],
      },
      {
        sku: "MENU-NON-08",
        name: "Pismat",
        category: "Menu Non Kopi",
        price: 24000,
        ops: JSON.stringify({
          standar: "Pistachio Matcha Latte (Pidato Singkat Manis Awal Tahun)",
          makna: "Menyindir sindrom 'kacang lupa kulitnya' yang sering mengidap para pejabat setelah terpilih.",
          filosofi: "Kemewahan Pistachio menyindir sindrom kacang lupa kulitnya, sementara hijau pekat Matcha melambangkan ilusi kemakmuran yang diobral lewat pidato manis di awal jabatan.",
        }),
        recipes: [
          { sku: "ING-POWDER-MATCHA", qty: 20 },
          { sku: "ING-SYRUP-PISTACHIO", qty: 15 },
          { sku: "ING-MILK-01", qty: 75 },
          { sku: "ING-CREAMER-01", qty: 5 },
          { sku: "ING-ICE-01", qty: 100 },
          { sku: "PKG-CUP-16OZ", qty: 1 },
        ],
      },

      // C. MOCKTAIL SECTION
      {
        sku: "MENU-MOCK-01",
        name: "Cranberry Mocktail",
        category: "Mocktail",
        price: 22000,
        ops: JSON.stringify({
          standar: "Coffee Fruity Mocktail",
          makna: "Perpaduan asam segar cranberry dan sentuhan kopi dingin yang menyegarkan dahaga.",
          filosofi: "Sebuah simbol keseimbangan antara asam manisnya dinamika kehidupan dan ketegasan pahitnya realita.",
        }),
        recipes: [
          { sku: "ING-SYRUP-CRANBERRY", qty: 25 },
          { sku: "ING-COFFEE-01", qty: 10 },
          { sku: "ING-ICE-01", qty: 100 },
          { sku: "PKG-CUP-16OZ", qty: 1 },
        ],
      },
    ];

    for (const om of officialMenus) {
      // Calculate accurate baseline HPP
      let totalHpp = 0;
      for (const r of om.recipes) {
        const mat = rawMaterials.find((m) => m.sku === r.sku);
        if (mat) {
          totalHpp += mat.costPerUseUnit * r.qty;
        }
      }
      totalHpp = Math.round(totalHpp);

      let existingMenu = await menuModel.findFirst({
        where: {
          OR: [{ sku: om.sku }, { name: om.name }],
        },
      });

      if (existingMenu) {
        existingMenu = await menuModel.update({
          where: { id: existingMenu.id },
          data: {
            sku: om.sku,
            name: om.name,
            category: om.category,
            price: om.price,
            baseHpp: totalHpp,
            ops: om.ops,
            isActive: true,
          },
        });
      } else {
        existingMenu = await menuModel.create({
          data: {
            sku: om.sku,
            name: om.name,
            category: om.category,
            price: om.price,
            baseHpp: totalHpp,
            ops: om.ops,
            isActive: true,
          },
        });
      }

      // Link recipes
      if (recipeModel) {
        await recipeModel.deleteMany({ where: { menuId: existingMenu.id } }).catch(() => null);
        for (const r of om.recipes) {
          const ingId = ingredientMap[r.sku];
          if (ingId) {
            await recipeModel.create({
              data: {
                menuId: existingMenu.id,
                ingredientId: ingId,
                quantityUsed: r.qty,
              },
            });
          }
        }
      }
    }

    console.log("Official Perkara Coffee Menus & Recipes Seeded Successfully!");
    return { success: true, count: officialMenus.length };
  } catch (error) {
    console.error("Error in seedOfficialPerkaraData:", error);
    throw error;
  }
}
