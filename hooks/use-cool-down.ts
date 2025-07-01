import React, { useEffect, useState } from "react";

const useCooldown = (initialCooldown: number = 30) => {
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prevCooldown) => prevCooldown - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const startCooldown = () => setCooldown(initialCooldown);

  return [cooldown, startCooldown] as const;
};

export default useCooldown;
