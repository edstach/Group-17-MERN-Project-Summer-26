import express from 'express';
import multer from 'multer';
import { GoogleGenerativeAI, Type } from '@google/generative-ai';

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: 10 * 1024 * 1024 },
})

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/parse' , upload.single('receiptImage'), async (req, res) => {
try {
    if(!req.file) {
        return res.status(400).json({ error: 'Please upload a receipt.'});
    }

    const imagePart = {
        inlineData: {
            data: req.file.buffer.toString('base64'),
            mimeType: req.file.mimetype,
        },
    };

    const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    storeName: { type: Type.STRING },
                    date: { type: Type.STRING },
                    items: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                name: { type: Type.STRING },
                                quantity: { type: Type.NUMBER },
                                unitPrice: { type: Type.NUMBER },
                                totalPrice: { type: Type.NUMBER },
                            },
                            required: ['id', 'name', 'quantity', 'totalPrice'],
                        },
                    },
                    subtotal: { type: Type.NUMBER },
                    tax: { type: Type.NUMBER },
                    tip: { type: Type.NUMBER },
                    fees: { type: Type.NUMBER },
                    total: { type: Type.NUMBER },
                },
                required: ['items', 'subtotal', 'tax', 'total'],
            },
        },
    });

    const prompt = 'Extract the following information from the receipt image: store name, date, items purchased (with id, name, quantity, unit price, and total price), subtotal, tax, tip, fees, and total. Assign a unique ID to each item. If tax, tip, or fees are not explicitly shown, default them to 0. Return the information in JSON format.';
    
    const response = await model.generateContent({ prompt, imagePart });
    const parsedReceipt = JSON.parse(response.response.text());

    const itemSum = parsedReceipt.items.reduce((sum, item) => sum + item.totalPrice, 0);
    if (Math.abs(itemSum - parsedReceipt.subtotal) > 0.50) {
        console.warn('Sum of items and subtotal do not match.');
    }

    return res.status(200).json({ success: true, data: parsedReceipt });
} catch (error) {
    console.error('Error scanning receipt:', error);
    return res.status(500).json({ error: 'Failed to scan receipt.' });
}
});

export default router;