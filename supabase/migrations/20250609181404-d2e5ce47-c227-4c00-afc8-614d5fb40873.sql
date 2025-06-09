
-- Add contact_number column to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS contact_number TEXT;

-- Enable realtime for the customers table to support live updates
ALTER TABLE customers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE customers;

-- Enable realtime for the delivery_records table to support live updates
ALTER TABLE delivery_records REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE delivery_records;
