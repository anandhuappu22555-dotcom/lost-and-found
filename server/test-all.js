const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5000/api';
let token = '';
let lostId, foundId, claimId;

async function run() {
    console.log('\n🧪 RUNNING FULL END-TO-END TEST\n');

    // 1. LOGIN
    try {
        const r = await axios.post(`${BASE}/auth/login`, { email: 'aakshna122005@gmail.com', password: 'password123' });
        token = r.data.token;
        console.log('✅ 1. Login OK — role:', r.data.user.role);
    } catch (e) { console.error('❌ 1. Login FAILED:', e.response?.data || e.message); return; }

    const auth = { headers: { Authorization: `Bearer ${token}` } };

    // 2. REPORT LOST ITEM (no image)
    try {
        const r = await axios.post(`${BASE}/items/lost`, {
            itemName: 'Test Wallet', category: 'Wallet',
            dateLost: '2026-03-01', lat: '8.5241', lng: '76.9366',
            locationText: 'Thiruvananthapuram', uniqueMarks: 'red stitching'
        }, auth);
        lostId = r.data.id;
        console.log('✅ 2. Report Lost Item OK — id:', lostId);
    } catch (e) { console.error('❌ 2. Report Lost FAILED:', e.response?.data || e.message); return; }

    // 3. REPORT FOUND ITEM (with image + masking)
    try {
        // Create a tiny test PNG in memory
        const testImagePath = path.join(__dirname, 'uploads/originals/test-image.png');
        // Use an existing image if available, otherwise use a small buffer
        let imgBuffer;
        const existingFiles = fs.readdirSync(path.join(__dirname, 'uploads/originals')).filter(f => f.endsWith('.png') && !f.startsWith('masked_'));
        if (existingFiles.length > 0) {
            imgBuffer = fs.readFileSync(path.join(__dirname, 'uploads/originals', existingFiles[0]));
        } else {
            // Create minimal 1x1 white PNG
            imgBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==', 'base64');
        }
        fs.writeFileSync(testImagePath, imgBuffer);

        const form = new FormData();
        form.append('itemName', 'Test Wallet Found');
        form.append('category', 'Wallet');
        form.append('lat', '8.5');
        form.append('lng', '76.9');
        form.append('locationText', 'Near Bus Stand');
        form.append('maskImage', 'true');
        form.append('image', fs.createReadStream(testImagePath), 'test-image.png');

        const r = await axios.post(`${BASE}/items/found`, form, {
            headers: { ...form.getHeaders(), Authorization: `Bearer ${token}` }
        });
        foundId = r.data.id;
        console.log('✅ 3. Report Found Item (with mask) OK — id:', foundId, '| imageUrl:', r.data.imageUrl);
    } catch (e) { console.error('❌ 3. Report Found FAILED:', e.response?.data || e.message); return; }

    // 4. INIT CLAIM
    try {
        const r = await axios.post(`${BASE}/claims/init`, { lostItemId: lostId, foundItemId: foundId }, auth);
        claimId = r.data.id;
        console.log('✅ 4. Init Claim OK — claimId:', claimId);
    } catch (e) { console.error('❌ 4. Init Claim FAILED:', e.response?.data || e.message); return; }

    // 5. SUBMIT VERIFICATION
    try {
        const r = await axios.post(`${BASE}/claims/verify/${claimId}`, {
            verificationData: { category: 'Wallet', wallet_brand_color: 'Black leather', cards_inside: 'Aadhar, SBI Debit', cash_amount: '500', unique_marks: 'red stitching' }
        }, auth);
        console.log('✅ 5. Submit Verification OK — status:', r.data.claim?.status);
    } catch (e) { console.error('❌ 5. Verification FAILED:', e.response?.data || e.message); return; }

    // 6. FINDER CLAIMS
    try {
        const r = await axios.get(`${BASE}/claims/finder-claims`, auth);
        console.log('✅ 6. Finder Claims OK — count:', r.data.length);
    } catch (e) { console.error('❌ 6. Finder Claims FAILED:', e.response?.data || e.message); return; }

    // 7. FINDER APPROVE
    try {
        const r = await axios.post(`${BASE}/claims/${claimId}/finder-action`, { action: 'approve' }, auth);
        console.log('✅ 7. Finder Approve OK — status:', r.data.status);
    } catch (e) { console.error('❌ 7. Finder Approve FAILED:', e.response?.data || e.message); return; }

    // 8. SEND CHAT MESSAGE
    try {
        const r = await axios.post(`${BASE}/chat/${claimId}`, { content: 'Hello! I can confirm it is mine.' }, auth);
        console.log('✅ 8. Chat Send OK — messageId:', r.data.id);
    } catch (e) { console.error('❌ 8. Chat FAILED:', e.response?.data || e.message); }

    // 9. DASHBOARD — my claims
    try {
        const r = await axios.get(`${BASE}/claims/my-claims`, auth);
        console.log('✅ 9. My Claims OK — count:', r.data.length);
    } catch (e) { console.error('❌ 9. My Claims FAILED:', e.response?.data || e.message); }

    console.log('\n🏁 TEST COMPLETE\n');
}

run().catch(console.error);
