"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv = __importStar(require("dotenv"));
// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
async function testRoleQuery() {
    const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    // Test user ID from your console log
    const userId = 'b819988e-abfa-406f-9ce5-9c34674a3824';
    console.log('Testing database connection...');
    try {
        // First, let's test if we can query the users table at all
        console.log('Attempting to query users table...');
        const { data: tableTest, error: tableError } = await supabase
            .from('users')
            .select('*')
            .limit(1);
        console.log('Table test result:', { data: tableTest, error: tableError });
        // Now try the specific role query
        console.log('\nAttempting to fetch role for user:', userId);
        const { data: roleData, error: roleError } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();
        console.log('Role query result:', { data: roleData, error: roleError });
    }
    catch (err) {
        console.error('Error in test:', err);
    }
}
testRoleQuery();
