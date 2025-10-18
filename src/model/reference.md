export function s(str: string) {
  return {
    asAID: (): AID => str as AID,
    asSAID: (): SAID => str as SAID,
    asALIAS: (): ALIAS => str as ALIAS,
  };
}