export function debugExpire(seconds = 5) {
  const newExpire = Date.now() + seconds * 1000; // ms
  localStorage.setItem("expires_at", newExpire);
  console.log(
    ` Debug: expires_at ถูกตั้งให้หมดอายุใน ${seconds} วิ (${new Date(
      newExpire
    )})`
  );
}
