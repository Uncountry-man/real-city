/*
 * Destinos de download do Real City — um por plataforma.
 *
 * Enquanto `url` estiver vazio, a plataforma aparece como "Link ainda não publicado"
 * e o botão fica desativado. Ao preencher `url`, o botão vira um link de download real.
 *
 * Campos opcionais (exibidos somente quando preenchidos):
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
};
