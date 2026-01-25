import React from "react";

type Props = {
  /** Numéro au format international SANS le + (ex: Canada: 14185551234, Togo: 22890000000) */
  phoneNumber: string;
  /** Message pré-rempli (optionnel) */
  message?: string;
  /** Afficher aussi sur desktop / mobile */
  className?: string;
};

const WhatsAppIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 32 32"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M19.11 17.23c-.27-.14-1.62-.8-1.87-.9-.25-.09-.43-.14-.61.14-.18.27-.7.9-.86 1.09-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.33-.8-.72-1.34-1.6-1.5-1.87-.16-.27-.02-.42.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.46.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.46h-.52c-.18 0-.48.07-.73.34-.25.27-.95.93-.95 2.27 0 1.34.98 2.64 1.11 2.82.14.18 1.93 2.95 4.68 4.13.66.28 1.17.45 1.57.58.66.21 1.26.18 1.73.11.53-.08 1.62-.66 1.85-1.29.23-.63.23-1.17.16-1.29-.07-.12-.25-.2-.52-.34z" />
    <path d="M16.01 3C8.86 3 3.05 8.8 3.05 15.95c0 2.3.6 4.46 1.65 6.34L3 29l6.9-1.62c1.8.99 3.86 1.56 6.11 1.56 7.15 0 12.95-5.8 12.95-12.95C28.96 8.8 23.16 3 16.01 3zm0 23.52c-2.08 0-4.01-.6-5.64-1.64l-.4-.25-4.09.96.96-3.99-.26-.41a10.98 10.98 0 0 1-1.71-5.83c0-6.06 4.93-10.99 10.99-10.99S27 9.9 27 15.96c0 6.06-4.93 10.99-10.99 10.99z" />
  </svg>
);

const WhatsAppFloating: React.FC<Props> = ({
  phoneNumber,
  message = "Bonjour, j’ai une question concernant une commande.",
  className = "",
}) => {
  const href = React.useMemo(() => {
    const clean = String(phoneNumber || "").replace(/[^\d]/g, "");
    const text = encodeURIComponent(message);
    // wa.me => numéro SANS "+"
    return `https://wa.me/${clean}?text=${text}`;
  }, [phoneNumber, message]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Contacter sur WhatsApp"
      className={[
        "fixed bottom-6 right-6 z-50",
        "h-14 w-14 rounded-full",
        "bg-primary text-primary-foreground",
        "shadow-lg ring-1 ring-black/5",
        "flex items-center justify-center",
        "transition-transform hover:scale-105 active:scale-95",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
        className,
      ].join(" ")}
      title="Nous contacter sur WhatsApp"
    >
      <WhatsAppIcon className="h-7 w-7" />
    </a>
  );
};

export default WhatsAppFloating;
