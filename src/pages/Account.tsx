// src/pages/Account.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

type Country = "togo" | "benin";
const phoneCodes: Record<Country, string> = { togo: "+228", benin: "+229" };

type Role = "admin" | "customer" | string;
type Step = "form" | "check_email";

const EMAIL_REDIRECT_TO = "https://www.belleawigs.com/account/confirmed";

export default function Account() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<Step>("form");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // form
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState<Country>("togo");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const ids = {
    authFullName: "auth_full_name",
    authCountry: "auth_country",
    authPhone: "auth_phone",
    authEmail: "auth_email",
    authPassword: "auth_password",
    authConfirmPassword: "auth_confirm_password",
  } as const;

  const ensureProfile = async (uid: string) => {
    // crée profile s'il n'existe pas (évite role null)
    const res = await sb.from("profiles").select("id, role").eq("id", uid).maybeSingle();
    if (res?.data?.id) return res.data;

    await sb.from("profiles").upsert({
      id: uid,
      role: "customer",
      updated_at: new Date().toISOString(),
    });

    const res2 = await sb.from("profiles").select("id, role").eq("id", uid).maybeSingle();
    return res2?.data ?? { id: uid, role: "customer" };
  };

  const redirectToSpace = async (uid: string) => {
    const p = await ensureProfile(uid);
    const role: Role = (p?.role ?? "customer") as any;
    navigate(role === "admin" ? "/admin" : "/account/dashboard", { replace: true });
  };

  // ✅ si déjà connecté, on redirige (page login ne doit pas servir de dashboard)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session ?? null;

        if (!mounted) return;

        if (session?.user?.id) {
          await redirectToSpace(session.user.id);
          return;
        }

        // optionnel: pré-remplir email depuis query ?email=
        const mail = (searchParams.get("email") || "").trim();
        if (mail) setEmail(mail);
      } catch (e) {
        // pas bloquant
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const title = useMemo(() => (isLogin ? "Connexion" : "Créer un compte"), [isLogin]);

  const handleToggleMode = () => {
    setIsLogin((v) => !v);
    setErrorMsg("");
    setInfo("");
    setPassword("");
    setConfirmPassword("");
    setStep("form");
  };

  const passwordLooksOk = () => {
    if (password.length < 6) return "Le mot de passe doit contenir au moins 6 caractères.";
    if (!isLogin && password !== confirmPassword) return "Les mots de passe ne correspondent pas.";
    if (!isLogin && (!fullName.trim() || !phone.trim())) return "Nom complet et téléphone requis.";
    return "";
  };

  const humanAuthError = (raw: string) => {
    const s = (raw || "").toLowerCase();

    // erreurs fréquentes supabase
    if (s.includes("invalid login credentials")) return "Email ou mot de passe incorrect.";
    if (s.includes("email not confirmed")) return "Ton email n’est pas encore confirmé.";
    if (s.includes("user already registered")) return "Un compte existe déjà avec cet email.";

    // réseau / timeout (ton 504)
    if (s.includes("504") || s.includes("timeout") || s.includes("failed to fetch") || s.includes("retryable")) {
      return "Erreur réseau (timeout). Réessaie dans 30 secondes, ou change de connexion (Wi-Fi/4G).";
    }

    return raw || "Une erreur est survenue.";
  };

  const resendConfirmation = async () => {
    const mail = email.trim();
    if (!mail) return;

    setLoading(true);
    setErrorMsg("");
    setInfo("");

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: mail,
        options: { emailRedirectTo: EMAIL_REDIRECT_TO },
      } as any);

      if (error) throw error;

      setInfo("Email de confirmation renvoyé ✅ Vérifie ta boîte mail (et tes spams).");
    } catch (e: any) {
      console.error("resend error:", e);
      setErrorMsg(humanAuthError(e?.message ?? "Impossible de renvoyer l’email."));
    } finally {
      setLoading(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setInfo("");

    const mail = email.trim();
    const pass = password;

    if (!mail || !pass) return;

    const pwdErr = passwordLooksOk();
    if (pwdErr) {
      setErrorMsg(pwdErr);
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: mail,
          password: pass,
        });

        if (error) throw error;

        const uid = data?.session?.user?.id;
        if (!uid) {
          setInfo("Connexion réussie. Redirection…");
          // fallback : re-check session
          const sess = await supabase.auth.getSession();
          const uid2 = sess.data?.session?.user?.id;
          if (uid2) await redirectToSpace(uid2);
          return;
        }

        await redirectToSpace(uid);
        return;
      }

      // SIGNUP (avec confirmation email)
      const phoneFull = `${phoneCodes[country]}${phone.trim()}`;

      const { data, error } = await supabase.auth.signUp({
        email: mail,
        password: pass,
        options: {
          data: { full_name: fullName.trim(), phone: phoneFull, country },
          emailRedirectTo: EMAIL_REDIRECT_TO,
        },
      });

      if (error) throw error;

      // UX pro : écran "check email" dans tous les cas
      setStep("check_email");
      setInfo(
        "Compte créé ✅ On t’a envoyé un email pour confirmer ton adresse. Ouvre le lien de confirmation, puis reviens te connecter."
      );

      // Si jamais la config supabase ne demande pas la confirmation => session possible
      const uid = data?.session?.user?.id;
      if (uid) await redirectToSpace(uid);
    } catch (err: any) {
      console.error("Auth error:", err);
      const msg = humanAuthError(err?.message ?? "Erreur de connexion/inscription");
      setErrorMsg(msg);

      if (msg.toLowerCase().includes("confirm")) {
        setInfo("Tu peux renvoyer l’email de confirmation juste en dessous.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ===========================
  // UI
  // ===========================
  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-16">
      <div className="w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6">
            <span className="font-serif text-3xl font-bold text-foreground">
              Belléa<span className="text-primary">Wigs</span>
            </span>
          </Link>

          <h1 className="font-serif text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-2">
            {isLogin ? "Connecte-toi pour accéder à ton espace." : "Crée ton compte en quelques secondes."}
          </p>
        </div>

        <div className="p-6 bg-card rounded-xl shadow-card border border-border">
          {/* STEP: CHECK EMAIL */}
          {step === "check_email" ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Vérifie ton email</p>
                  <p className="text-sm text-muted-foreground">
                    On a envoyé un lien de confirmation à :
                    <span className="font-medium text-foreground"> {email.trim()}</span>
                  </p>
                </div>
              </div>

              {info && <div className="bg-primary/10 text-primary text-sm p-3 rounded-lg">{info}</div>}
              {errorMsg && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">{errorMsg}</div>}

              <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" onClick={resendConfirmation} disabled={loading || !email.trim()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {loading ? "Renvoi..." : "Renvoyer l’email"}
                </Button>

                <Button
                  type="button"
                  variant="hero"
                  onClick={() => {
                    setIsLogin(true);
                    setStep("form");
                    setInfo("");
                    setErrorMsg("");
                  }}
                >
                  Aller à la connexion
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Astuce : vérifie aussi les spams / courriers indésirables. Si tu es sur iCloud/Outlook, ça peut aller en
                “Promotions”.
              </p>
            </div>
          ) : (
            <>
              {/* MESSAGES */}
              {!!info && <div className="mb-4 bg-primary/10 text-primary text-sm p-3 rounded-lg">{info}</div>}

              {!!errorMsg && (
                <div className="mb-4 bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <div>{errorMsg}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor={ids.authFullName}>Nom complet</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id={ids.authFullName}
                        name="full_name"
                        autoComplete="name"
                        placeholder="Votre nom"
                        className="pl-10"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor={ids.authCountry}>Pays</Label>
                    <select
                      id={ids.authCountry}
                      name="country"
                      autoComplete="country-name"
                      value={country}
                      onChange={(e) => setCountry(e.target.value as Country)}
                      className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="togo">Togo</option>
                      <option value="benin">Bénin</option>
                    </select>
                  </div>
                )}

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor={ids.authPhone}>Téléphone</Label>
                    <div className="flex gap-2">
                      <span className="px-2 py-2 bg-muted border border-border rounded text-sm flex items-center min-w-[56px]">
                        {phoneCodes[country]}
                      </span>
                      <Input
                        id={ids.authPhone}
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        placeholder="90 00 00 00"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor={ids.authEmail}>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id={ids.authEmail}
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="votre@email.com"
                      className="pl-10"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={ids.authPassword}>Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id={ids.authPassword}
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor={ids.authConfirmPassword}>Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id={ids.authConfirmPassword}
                        name="confirm_password"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className={cn("pl-10 pr-10", errorMsg && "border-destructive focus-visible:ring-destructive")}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        aria-label={showConfirmPassword ? "Masquer la confirmation" : "Afficher la confirmation"}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Veuillez patienter..." : isLogin ? "Se connecter" : "Créer mon compte"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                {/* ✅ si email non confirmé => bouton renvoi */}
                {isLogin && errorMsg.toLowerCase().includes("confirm") && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={resendConfirmation}
                    disabled={loading || !email.trim()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Renvoyer l’email de confirmation
                  </Button>
                )}
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">{isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}</span>{" "}
                <button type="button" onClick={handleToggleMode} className="text-primary font-medium hover:underline">
                  {isLogin ? "S'inscrire" : "Se connecter"}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          En continuant, tu acceptes nos conditions et notre politique de confidentialité.
        </p>
      </div>
    </div>
  );
}
