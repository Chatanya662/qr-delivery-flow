
-- Create a function to force delete a customer and bypass RLS
CREATE OR REPLACE FUNCTION public.delete_customer_force(customer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the customer record directly
  -- SECURITY DEFINER allows this function to bypass RLS policies
  DELETE FROM public.customers WHERE id = customer_id;
  
  -- If no rows were affected, raise an exception
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer with id % not found', customer_id;
  END IF;
END;
$$;
