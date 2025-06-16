
-- Enable RLS on customers table if not already enabled
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Allow authenticated users to view customers" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated users to insert customers" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated users to update customers" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated users to delete customers" ON public.customers;

-- Create policy to allow authenticated users to view customers
CREATE POLICY "Allow authenticated users to view customers" 
ON public.customers 
FOR SELECT 
TO authenticated 
USING (true);

-- Create policy to allow authenticated users to insert customers
CREATE POLICY "Allow authenticated users to insert customers" 
ON public.customers 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Create policy to allow authenticated users to update customers
CREATE POLICY "Allow authenticated users to update customers" 
ON public.customers 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create policy to allow authenticated users to delete customers
CREATE POLICY "Allow authenticated users to delete customers" 
ON public.customers 
FOR DELETE 
TO authenticated 
USING (true);

-- Enable RLS on delivery_records table
ALTER TABLE public.delivery_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Allow authenticated users to view delivery records" ON public.delivery_records;
DROP POLICY IF EXISTS "Allow authenticated users to insert delivery records" ON public.delivery_records;
DROP POLICY IF EXISTS "Allow authenticated users to update delivery records" ON public.delivery_records;
DROP POLICY IF EXISTS "Allow authenticated users to delete delivery records" ON public.delivery_records;

-- Create policies for delivery_records table
CREATE POLICY "Allow authenticated users to view delivery records" 
ON public.delivery_records 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert delivery records" 
ON public.delivery_records 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update delivery records" 
ON public.delivery_records 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete delivery records" 
ON public.delivery_records 
FOR DELETE 
TO authenticated 
USING (true);

-- Enable RLS on customer_payments table
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Allow authenticated users to view customer payments" ON public.customer_payments;
DROP POLICY IF EXISTS "Allow authenticated users to insert customer payments" ON public.customer_payments;
DROP POLICY IF EXISTS "Allow authenticated users to update customer payments" ON public.customer_payments;
DROP POLICY IF EXISTS "Allow authenticated users to delete customer payments" ON public.customer_payments;

-- Create policies for customer_payments table
CREATE POLICY "Allow authenticated users to view customer payments" 
ON public.customer_payments 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert customer payments" 
ON public.customer_payments 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update customer payments" 
ON public.customer_payments 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete customer payments" 
ON public.customer_payments 
FOR DELETE 
TO authenticated 
USING (true);
