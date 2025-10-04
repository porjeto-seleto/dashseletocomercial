-- Ensure the user has admin role
INSERT INTO user_roles (user_id, role) 
VALUES ('041abd1a-2ff2-4f96-b259-966228b42b6a', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;