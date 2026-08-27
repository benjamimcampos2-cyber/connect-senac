// backend/config/database.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Buscando as variáveis de ambiente protegidas
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('ERRO: Credenciais do Supabase (SUPABASE_URL e SUPABASE_KEY) ausentes nas variáveis de ambiente (.env).');
    throw new Error('Credenciais do Supabase ausentes.');
}

let wsImplementation;
try {
    wsImplementation = require('ws');
} catch (_) {}

const options = {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
};

if (wsImplementation) {
    options.realtime = {
        transport: wsImplementation
    };
}

// Criando a instância de conexão com o banco de dados
const supabase = createClient(supabaseUrl, supabaseKey, options);

console.log('Conectado ao Supabase (PostgreSQL) com sucesso!');

// Exportamos a instância para ser usada pelos Controllers
module.exports = supabase;