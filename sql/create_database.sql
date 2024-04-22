-- Vérifier si la base de données existe déjà
DO $$BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'logs_bdd') THEN
        -- Créer la base de données uniquement si elle n'existe pas
        CREATE DATABASE logs_bdd;
    END IF;
END$$;
