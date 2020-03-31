export class AppFns {
  static get isMobile() {
    return screen.width <= 800;
  }

  static adaptCountryNames(
    countryMap: Map<string, any>,
    altMap: Map<string, string>
  ): Map<string, any> {
    const tmpMap = new Map(countryMap);

    for (const originalName of altMap.keys()) {
      const valList: any[] | undefined = tmpMap.get(originalName);
      const altName: string | undefined = altMap.get(originalName);
      if (valList && altName) {
        tmpMap.set(altName, valList);
        tmpMap.delete(originalName);
      }
    }

    return tmpMap;
  }
}
