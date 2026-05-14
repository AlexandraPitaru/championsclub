import type { ComponentPropsWithoutRef } from "react";
import { useTheme } from "../../app/theme/ThemeProvider";

const logoByTheme = {
  dark: "/logo_dark_mode.png",
  light: "/logo_light_mode.png",
} as const;

type BrandLogoProps = Omit<ComponentPropsWithoutRef<"img">, "alt" | "src"> & {
  alt?: string;
};

export default function BrandLogo({
  alt = "ChampionsClub logo",
  decoding = "async",
  loading = "eager",
  ...imageProps
}: BrandLogoProps) {
  const { theme } = useTheme();

  return (
    <img
      {...imageProps}
      src={logoByTheme[theme]}
      alt={alt}
      decoding={decoding}
      loading={loading}
    />
  );
}
