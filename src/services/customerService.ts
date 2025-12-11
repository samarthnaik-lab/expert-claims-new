export interface Customer {
  customer_id: number;
  customer_name: string;
}

export interface CustomerApiResponse {
  customers: Customer[];
}

export interface SingleCustomerResponse {
  customer_id: number;
  customer_name: string;
}

export class CustomerService {
  private static readonly API_URL = 'http://localhost:3000/support/getcustomers';

  static async getCustomers(sessionId: string, jwtToken: string): Promise<Customer[]> {
    try {
      const response = await fetch(this.API_URL, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CustomerApiResponse | SingleCustomerResponse | Customer[] = await response.json();
      console.log('Raw customer API response:', data);
      
      // Handle response with customers wrapper array
      if (data && typeof data === 'object' && 'customers' in data && Array.isArray(data.customers)) {
        const validCustomers = data.customers
          .filter(customer => 
            customer && 
            customer.customer_id && 
            customer.customer_name && 
            customer.customer_name.trim() !== ''
          )
          .map(customer => ({
            ...customer,
            customer_name: customer.customer_name.trim()
          }));
        console.log('Processed customers array:', validCustomers);
        return validCustomers;
      }
      
      // Handle direct array response if it exists (fallback)
      if (Array.isArray(data)) {
        const validCustomers = data
          .filter(customer => 
            customer && 
            customer.customer_id && 
            customer.customer_name && 
            customer.customer_name.trim() !== ''
          )
          .map(customer => ({
            ...customer,
            customer_name: customer.customer_name.trim()
          }));
        console.log('Processed direct array response:', validCustomers);
        return validCustomers;
      }
      
      // Handle single customer response (fallback)
      if (data && typeof data === 'object' && 'customer_id' in data && 'customer_name' in data) {
        const customerData = data as SingleCustomerResponse;
        const customer: Customer = {
          customer_id: customerData.customer_id,
          customer_name: customerData.customer_name.trim()
        };
        console.log('Processed single customer:', customer);
        return [customer];
      }
      
      throw new Error('Invalid response format from customer API');
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  }
}
