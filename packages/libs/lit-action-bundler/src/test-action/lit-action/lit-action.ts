 
import { litActionHandler } from '../../lib/litActionHandler/litActionHandler';
import { installNodeGlobals } from '../../lib/prelude';
import { myLitAction } from './myLitAction';

declare const wat: string;

(async () => {
  await installNodeGlobals();

  return await litActionHandler(() => myLitAction({ wat }));
})();
