
-- Create a table to track customer payments
CREATE TABLE public.customer_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  amount_due DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_date DATE NULL,
  notes TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(customer_id, month, year)
);

-- Enable Row Level Security
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for customer payments
-- Owners can do everything
CREATE POLICY "Owners can manage all payments" 
  ON public.customer_payments 
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'owner'
    )
  );

-- Customers can only view their own payment records
CREATE POLICY "Customers can view their own payments" 
  ON public.customer_payments 
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers 
      WHERE customers.id = customer_payments.customer_id 
      AND customers.profile_id = auth.uid()
    )
  );

-- Create function to automatically calculate amount due based on delivery records
CREATE OR REPLACE FUNCTION calculate_monthly_amount_due(
  p_customer_id UUID,
  p_month INTEGER,
  p_year INTEGER
) RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
AS $$
DECLARE
  delivered_days INTEGER;
  daily_rate DECIMAL(10,2);
  total_amount DECIMAL(10,2);
BEGIN
  -- Get the customer's daily rate (quantity * price per liter, assuming 60 per liter)
  SELECT quantity * 60 INTO daily_rate
  FROM customers 
  WHERE id = p_customer_id;
  
  -- Count delivered days for the month
  SELECT COUNT(*) INTO delivered_days
  FROM delivery_records
  WHERE customer_id = p_customer_id
    AND EXTRACT(MONTH FROM delivery_date) = p_month
    AND EXTRACT(YEAR FROM delivery_date) = p_year
    AND status = 'delivered';
  
  -- Calculate total amount
  total_amount := delivered_days * COALESCE(daily_rate, 0);
  
  RETURN COALESCE(total_amount, 0);
END;
$$;
