export interface Invoice {
    id: string;
    number: string;
    issueDate: string;
    dueDate: string;
    paymentStatus: string;
    invoiceTotal: number;
    currency: string;
    customer?: {
        id: string;
        name: string;
        externalId: string;
    };
}
