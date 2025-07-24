export type GetLitActionHandlerFunc = ({
  outputPath,
  ipfsCid,
  sourcePath,
}: {
  outputPath: string;
  ipfsCid: string;
  sourcePath: string;
}) => string;

export type BuildLitActionOptions = {
  entryPoint: string;
  outdir: string;
  tsconfigPath: string;
  getLitActionHandler: GetLitActionHandlerFunc;
};
