import { ComponentType, ReactNode } from 'react';

export type ParentComponent = ComponentType<{ children: ReactNode }>;

/**
 * Compose multiple components into a single one respecting the order they are passed
 * @example
 * compose([A, B, C]) => ({ children }) => <A><B><C>{children}</C></B></A>
 *
 * @param components
 */
export const compose = (components: ParentComponent[]) => {
  return ({ children }: { children: ReactNode }) => {
    return components.reduceRight((acc, Component) => {
      return <Component>{acc}</Component>;
    }, children);
  };
};

/**
 * Wraps a component with the given array of components
 * @example
 * wrap(Component, [A, B, C]) => () => <A><B><C><Component /></C></B></A>
 *
 * @param Wrapped - The component to wrap
 * @param Wrappers - The components to wrap the given component with
 */
export const wrap = <P extends object>(Wrapped: ComponentType<P>, Wrappers: ParentComponent[]) => {
  const ComposedProviders = compose(Wrappers);

  return function WithProvidersWrapper(props: P) {
    return (
      <ComposedProviders>
        <Wrapped {...props} />
      </ComposedProviders>
    );
  };
};
