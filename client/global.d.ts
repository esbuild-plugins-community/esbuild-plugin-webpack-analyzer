declare module '*.css' {
  const styles: { [key: string]: string };
  export = styles;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '@carrotsearch/foamtree' {
  const FoamTree: any;
  export default FoamTree;
}
