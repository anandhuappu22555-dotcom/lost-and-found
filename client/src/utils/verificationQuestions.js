/**
 * Returns category-specific verification questions.
 * Each question has: key, label, placeholder, type (text|textarea)
 */
export const getVerificationQuestions = (category = '') => {
    const cat = category.toLowerCase();

    if (cat === 'electronics') {
        return [
            { key: 'brand_model', label: 'What is the brand and model?', placeholder: 'e.g. Apple iPhone 13 Pro, Samsung Galaxy S22', type: 'text', required: true },
            { key: 'color_appearance', label: 'What is the exact color and any case/cover?', placeholder: 'e.g. Midnight black with a green silicone case', type: 'text', required: true },
            { key: 'screen_condition', label: 'Describe any screen cracks, scratches, or stickers?', placeholder: 'e.g. Small crack on the top-right corner', type: 'text', required: true },
            { key: 'apps_or_wallpaper', label: 'Name 2 apps on the device OR describe the wallpaper', placeholder: 'e.g. Duolingo and my dog photo as wallpaper', type: 'text', required: true },
        ];
    }

    if (cat === 'wallet') {
        return [
            { key: 'wallet_brand_color', label: 'What brand and color is the wallet?', placeholder: 'e.g. Black leather Tommy Hilfiger', type: 'text', required: true },
            { key: 'cards_inside', label: 'Name at least 2 specific cards/IDs inside', placeholder: 'e.g. SBI Debit card, Aadhar card, College ID', type: 'text', required: true },
            { key: 'cash_amount', label: 'Approx how much cash was inside (if any)?', placeholder: 'e.g. About ₹500, or empty', type: 'text', required: true },
            { key: 'unique_item', label: 'Any special item inside? (photo, receipt, ticket, etc.)', placeholder: 'e.g. A small photo of my family', type: 'text', required: false },
        ];
    }

    if (cat === 'keys') {
        return [
            { key: 'key_count', label: 'How many keys are on the keychain?', placeholder: 'e.g. 3 keys', type: 'text', required: true },
            { key: 'keychain_description', label: 'Describe the keychain or any tags/fobs attached', placeholder: 'e.g. A black car remote and a Minion keychain', type: 'text', required: true },
            { key: 'key_type', label: 'What are the keys for? (home, car, locker, etc.)', placeholder: 'e.g. House door, office cupboard', type: 'text', required: true },
        ];
    }

    if (cat === 'bag') {
        return [
            { key: 'bag_brand_color', label: 'What is the brand, color, and type of bag?', placeholder: 'e.g. Navy blue Wildcraft backpack', type: 'text', required: true },
            { key: 'bag_contents', label: 'List 3 specific items that were inside the bag', placeholder: 'e.g. Red water bottle, laptop charger, Physics notebook', type: 'textarea', required: true },
            { key: 'bag_marks', label: 'Any zippers broken, badges, or unique marks?', placeholder: 'e.g. A badge on the front pocket, broken side zipper', type: 'text', required: true },
        ];
    }

    if (cat === 'clothing') {
        return [
            { key: 'clothing_brand_size', label: 'What is the brand, size, and exact color?', placeholder: 'e.g. H&M, XL, olive green', type: 'text', required: true },
            { key: 'clothing_print', label: 'Any prints, logos, or text on the clothing?', placeholder: 'e.g. A NASA logo print on the chest', type: 'text', required: true },
            { key: 'clothing_damage', label: 'Any stains, tears, or alterations?', placeholder: 'e.g. Small bleach stain on the left sleeve', type: 'text', required: false },
        ];
    }

    if (cat === 'accessories') {
        return [
            { key: 'accessory_type', label: 'What type of accessory is it exactly?', placeholder: 'e.g. Wristwatch, sunglasses, bracelet', type: 'text', required: true },
            { key: 'accessory_material', label: 'What brand, material, or color is it?', placeholder: 'e.g. Titan silver-colored watch with leather band', type: 'text', required: true },
            { key: 'accessory_marks', label: 'Any engravings, scratches, or special markings?', placeholder: 'e.g. "Love, Mom" engraved on the back', type: 'text', required: true },
        ];
    }

    if (cat === 'documents') {
        return [
            { key: 'doc_type', label: 'What type of document is it?', placeholder: 'e.g. Passport, Driving License, Aadhar Card', type: 'text', required: true },
            { key: 'doc_name', label: 'What is the exact name printed on the document?', placeholder: 'e.g. Aakshna Kumar', type: 'text', required: true },
            { key: 'doc_id_number', label: 'What is the ID/Document number? (partial is OK)', placeholder: 'e.g. XXXX-XXXX-1234', type: 'text', required: true },
        ];
    }

    // Default fallback for Other / unknown categories
    return [
        { key: 'detailed_description', label: 'Describe the item in detail', placeholder: 'Brand, color, size, material, any unique features...', type: 'textarea', required: true },
        { key: 'unique_marks', label: 'What unique marks, scratches, or identifiers does it have?', placeholder: 'e.g. Sticker on the back, initials scratched in', type: 'text', required: true },
        { key: 'how_lost', label: 'Where and when exactly did you lose it?', placeholder: 'e.g. At the bus stop near City Mall at 3pm', type: 'text', required: true },
    ];
};
