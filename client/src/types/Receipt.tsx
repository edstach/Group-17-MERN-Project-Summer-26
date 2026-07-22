import {z} from "zod";

export const ReceiptSchema = z.object({
    storeName: z.string().nullable().describe("name of organization who produced the receipt"),
    date: z.string().nullable().describe("date of purchase if visible"),
    items: z.array(
        z.object({
            id: z.string().describe("unique identifier, e.g., item_1"),
            name: z.string().describe("name of the item"),
            quantity: z.number().default(1).describe("quantity of the item"),
            unitPrice: z.number().nullable().describe("price per unit if applicable"),
            totalPrice: z.number().describe("total price for the item (item * quantity"),
        })
    ).describe("list of all individual line items"),
    subtotal: z.number().describe("total before tip,tax, and additional fees"),
    tax: z.number().default(0).describe("total sales tax"),
    tip: z.number().default(0).describe("tip or gratuity amount as shown on receipt"),
    fees: z.number().default(0).describe("any additional fees such as service, delivery, or extra surcharges"),
    total: z.number().describe("total amount charged"),
})

export type ReceiptData = z.infer<typeof ReceiptSchema>;




