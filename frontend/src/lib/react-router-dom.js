"use client";

import React, { useMemo } from 'react';
import NextLink from 'next/link';
import { useRouter, usePathname, useSearchParams as useNextSearchParams, useParams as useNextParams } from 'next/navigation';

export function Link({ to, children, replace, state, ...props }) {
  return (
    <NextLink href={to} replace={replace} {...props}>
      {children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  return (to, options) => {
    if (typeof to === 'number') {
      if (to === -1) router.back();
      else if (to === 1) router.forward();
      return;
    }
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
}

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useNextSearchParams();
  
  const search = searchParams && searchParams.toString() ? `?${searchParams.toString()}` : '';

  return {
    pathname: pathname || '/',
    search,
    hash: '', // next/navigation doesn't expose hash natively yet, usually not an issue
    state: null,
  };
}

export function useParams() {
  const params = useNextParams();
  return params || {};
}

export function useSearchParams() {
  const router = useRouter();
  const pathname = usePathname();
  const nextSearchParams = useNextSearchParams();
  
  const searchParams = useMemo(() => {
    return new URLSearchParams(nextSearchParams?.toString() || '');
  }, [nextSearchParams]);

  const setSearchParams = (params) => {
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ''}`);
  };

  return [searchParams, setSearchParams];
}
