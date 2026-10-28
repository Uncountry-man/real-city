/*
 * Destinos de download — um por plataforma.
 * `android`, `ios` e `windows` são do Real City (versão principal);
 * `capital_android` é o Capital City SAMP (versão leve).
 *
 * Enquanto `url` estiver vazio, a plataforma não ganha botão e aparece em "Em breve".
 * Ao preencher `url`, surge o botão de download.
 *
 * Campos opcionais (dica do botão, somente quando preenchidos):
 *   version      — ex.: "1.0.3"
 *   size         — ex.: "1,2 GB"
 *   requirements — ex.: "Android 8.0 ou superior"
 *
 * `url` pode ser um endereço absoluto (https://...) ou um arquivo hospedado junto
 * com o site (ex.: "downloads/real-city.apk").
 */
window.REAL_CITY_DOWNLOADS = {
  android: { url: "https://github.com/theus1h/TESTE1/releases/download/145/capital-city-145.apk", version: "", size: "", requirements: "" },
  ios:     { url: "", version: "", size: "", requirements: "" },
  windows: { url: "", version: "", size: "", requirements: "" },
  capital_android: { url: "https://pub-38ff6d5aed8147dc86c59338cc9e50b6.r2.dev/capital-character-candidate-signed.apk", version: "", size: "", requirements: "" },
};
