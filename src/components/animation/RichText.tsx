import { Fragment } from "react";
import type { RichText as RichTextValue } from "@/content";

/** Un href externo empieza por protocolo; los internos son anclas o rutas. */
function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

/**
 * Renderiza el `RichText` del contenido: texto plano con enlaces intercalados.
 *
 * El subrayado usa `--label-3` y se aclara a `--label-1` en hover, como en la
 * referencia — solo con puntero fino, para no dejarlo pegado en touch.
 */
export function RichText({ value }: { value: RichTextValue }) {
  return (
    <>
      {value.map((node, index) => {
        if (typeof node === "string") return <Fragment key={index}>{node}</Fragment>;

        const external = isExternal(node.href);
        return (
          <a
            key={index}
            href={node.href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="text-l1 decoration-l3 hover:decoration-l1 inline underline decoration-solid underline-offset-[0.08em] transition-[text-decoration-color] duration-150 ease-out"
          >
            {node.text}
          </a>
        );
      })}
    </>
  );
}
