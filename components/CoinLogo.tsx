import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import { useCoinLogo } from "@/lib/coin-logos";

type CoinLogoProps = {
  symbol: string;
  size: number;
  iconType?: "mci" | "feather";
  iconName?: string;
  iconColor?: string;
};

export default function CoinLogo({
  symbol,
  size,
  iconType = "feather",
  iconName = "circle",
  iconColor = "#9CA3AF",
}: CoinLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const logoUri = useCoinLogo(symbol);

  useEffect(() => {
    setImageFailed(false);
  }, [symbol, logoUri]);

  if (logoUri && !imageFailed) {
    return (
      <Image
        source={{ uri: logoUri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        transition={120}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <View style={[styles.fallbackWrap, { width: size, height: size, borderRadius: size / 2 }]}>
      {iconType === "mci" ? (
        <MaterialCommunityIcons name={iconName as never} size={Math.round(size * 0.62)} color={iconColor} />
      ) : (
        <Feather name={iconName as never} size={Math.round(size * 0.52)} color={iconColor} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});

