# Supabase Configuration

## ⚙️ Variables d'Environnement

Crée un fichier `.env.local` à la racine du projet avec:

```
VITE_SUPABASE_URL=https://ccdefnjxrfcjsffrzrab.supabase.co
VITE_SUPABASE_ANON_KEY=<TON_ANON_KEY_ICI>
VITE_SUPABASE_PUBLISHABLE_KEY=<TON_ANON_KEY_ICI>
```

### 🔑 Comment obtenir tes clés

1. Va sur https://app.supabase.com
2. Sélectionne ton projet "kwzyulrtlxmdlnnqwppm"
3. Clique sur **Settings** → **API**
4. Tu verras:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Anon (public)** → `VITE_SUPABASE_ANON_KEY` et `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## 📚 Structure des Données

### Products Table
```json
{
  "id": "uuid",
  "name": "Nom du produit",
  "description": "Description détaillée",
  "price": 5000,                    // En cents
  "original_price": 7000,           // Optionnel
  "category": "natural-wigs",       // Enum
  "extension_type": "amina",        // Optionnel
  "images": ["url1", "url2"],       // Array
  "in_stock": true,
  "stock_count": 10,
  "featured": false,
  "details": ["Détail 1", "Détail 2"],  // Array
  "rating": 4.5,
  "review_count": 12,
  "created_at": "2026-01-18T...",
  "updated_at": "2026-01-18T..."
}
```

### Categories disponibles
- `natural-wigs`
- `synthetic-wigs`
- `natural-weaves`
- `synthetic-weaves`
- `extensions`
- `accessories`

### Extension Types disponibles
- `amina`
- `kanekalon`
- `xpression`
- `darling`
- `sensationnel`
- `rastafri`
- `clip-in`
- `tape-in`

---

## 🧪 Tester la Connexion

```tsx
// src/App.tsx ou n'importe où
import { supabase } from '@/integrations/supabase/client';

useEffect(() => {
  const testConnection = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('count', { count: 'exact' });
    
    if (error) {
      console.error('Erreur Supabase:', error);
    } else {
      console.log('✅ Supabase connecté!', data);
    }
  };
  
  testConnection();
}, []);
```

---

## 🐛 Troubleshooting

### Erreur: "Missing or invalid JWT"
→ Vérifie que `VITE_SUPABASE_ANON_KEY` est correct et complet

### Erreur: "Connection refused"
→ Vérifie que `VITE_SUPABASE_URL` est correct

### Pas de données
→ Assure-toi que les données existent dans la table `products`

### Images ne chargent pas
→ Vérifie que le bucket `product-images` existe dans Supabase Storage

---

## 📝 RLS Policies

Les politiques de rangée (Row Level Security) doivent être configurées:

```sql
-- Products: Lecture publique
CREATE POLICY "Enable read access for all users"
  ON public.products FOR SELECT
  USING (true);

-- Admin users: Lecture avec conditions
CREATE POLICY "Admins can view all"
  ON public.admin_users FOR SELECT
  USING (auth.uid() = user_id);

-- Orders: Accès utilisateur
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid()::text = user_id);
```

---

## 🚀 Prochaines Actions

1. ✅ Mise à jour des variables d'environnement
2. ✅ Tester la connexion
3. ✅ Vérifier les données dans `products` table
4. ✅ Implémenter les mutations dans AdminDashboard
5. ✅ Mettre à jour les pages de checkout

