import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
  },

  colors: {
    brand: {
      50: '#e6fffa',
      100: '#b2f5ea',
      200: '#81e6d9',
      300: '#4fd1c5',
      400: '#38b2ac',
      500: '#319795', // Main brand color
      600: '#2c7a7b',
      700: '#285e61',
      800: '#234e52',
      900: '#1a3c34',
    },
    gray: {
      50: '#f7fafc',
      100: '#edf2f7',
      200: '#e2e8f0',
      300: '#cbd5e0',
      400: '#a0aec0',
      500: '#718096',
      600: '#4a5568',
      700: '#2d3748',
      800: '#1a202c',
      900: '#171923',
    },
    blue: {
      500: '#3182ce',
      600: '#2b6cb0',
    },
    red: {
      500: '#e53e3e',
      600: '#c53030',
    },
    kakao: {
      500: '#FEE500',
      600: '#E4D100',
    },
    naver: {
      500: '#03C75A',
      600: '#02B050',
    },
    google: {
      500: '#ffffff',
      600: '#f7fafc',
    },
  },

  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.700',
        fontFamily: 'body',
      },
      '*': {
        transition: 'all 0.2s ease',
      },
    },
  },

  components: {
    Input: {
      baseStyle: {
        field: {
          borderColor: 'gray.200',
          borderWidth: '1px',
          borderRadius: 'full',
          bg: 'white',
          boxShadow: 'sm',
          _hover: {
            borderColor: 'brand.500',
            boxShadow: 'md',
          },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 2px rgba(49, 151, 149, 0.2)',
          },
        },
      },
      sizes: {
        md: {
          field: {
            fontSize: { base: 'sm', md: 'md' },
            // 고정 height 제거
            // height: '40px',
            // lineHeight을 좀 더 넉넉하게
            lineHeight: '1.4',
            px: 4, // 좌우 패딩
            py: 2, // 상하 패딩
          },
        },
      },
    },


    Select: {
      baseStyle: {
        field: {
          borderColor: 'gray.200',
          borderWidth: '1px',
          borderRadius: 'full',
          bg: 'white',
          boxShadow: 'sm',
          _hover: {
            borderColor: 'brand.500',
            boxShadow: 'md',
          },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 2px rgba(49, 151, 149, 0.2)',
          },
        },
      },
      sizes: {
        md: {
          field: {
            fontSize: { base: 'sm', md: 'md' },
            // 고정 height 제거
            // height: '40px',
            lineHeight: '1.4',
            px: 4,
            py: 2,
          },
        },
      },
    },


    Button: {
      baseStyle: {
        borderRadius: 'full',
        fontWeight: 'medium',
        _focus: {
          boxShadow: '0 0 0 3px rgba(49, 151, 149, 0.2)',
        },
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          boxShadow: 'md',
          _hover: {
            bg: 'brand.600',
            transform: 'scale(1.05)',
            boxShadow: 'lg',
          },
          _active: {
            bg: 'brand.700',
            transform: 'scale(0.95)',
          },
        },
        outline: {
          borderColor: 'gray.200',
          color: 'gray.700',
          boxShadow: 'sm',
          _hover: {
            bg: 'gray.100',
            transform: 'scale(1.05)',
            boxShadow: 'md',
          },
          _active: {
            transform: 'scale(0.95)',
          },
        },
        link: {
          color: 'brand.500',
          _hover: {
            color: 'brand.600',
            textDecoration: 'none',
            transform: 'scale(1.02)',
          },
        },
        kakao: {
          bg: 'kakao.500',
          color: 'black',
          boxShadow: 'sm',
          _hover: {
            bg: 'kakao.600',
            transform: 'scale(1.05)',
            boxShadow: 'md',
          },
          _active: {
            bg: '#D4C100',
            transform: 'scale(0.95)',
          },
        },
        naver: {
          bg: 'white',
          color: 'gray.700',
          borderWidth: '1px',
          borderColor: 'gray.200',
          boxShadow: 'sm',
          _hover: {
            bg: 'naver.500',
            color: 'white',
            transform: 'scale(1.05)',
            boxShadow: 'md',
          },
        },
        google: {
          bg: 'google.500',
          color: 'gray.700',
          borderWidth: '1px',
          borderColor: 'gray.200',
          boxShadow: 'sm',
          _hover: {
            bg: 'google.600',
            transform: 'scale(1.05)',
            boxShadow: 'md',
          },
        },
        homeButton: {
          bg: 'white',
          color: 'gray.700',
          borderWidth: '1px',
          borderColor: 'gray.200',
          boxShadow: 'sm',
          _hover: {
            bg: 'gray.100',
            transform: 'scale(1.05)',
            boxShadow: 'md',
          },
        },
        homeButtonSecondary: {
          bg: 'white',
          color: 'gray.700',
          borderWidth: '1px',
          borderColor: 'gray.200',
          boxShadow: 'sm',
          _hover: {
            bg: 'teal.50',
            transform: 'scale(1.05)',
            boxShadow: 'md',
          },
        },
      },
      sizes: {
        md: {
          fontSize: { base: 'sm', md: 'md' },
          padding: { base: '2', md: '3' },
          height: { base: '40px', md: '44px' },
        },
      },
    },

    FormLabel: {
      baseStyle: {
        color: 'gray.600',
        fontSize: { base: 'xs', md: 'sm' },
        lineHeight: 'normal',
        marginBottom: '1',
      },
    },

    Text: {
      baseStyle: {
        color: 'gray.700',
        fontSize: { base: 'sm', md: 'md' },
        lineHeight: 'tall',
      },
    },

    Box: {
      variants: {
        card: {
          bg: 'white',
          borderWidth: '1px',
          borderColor: 'gray.200',
          borderRadius: 'lg',
          boxShadow: 'sm',
          p: { base: '3', md: '4' },
          maxW: 'sm',
          mx: 'auto',
          transition: 'all 0.3s ease',
          _hover: {
            boxShadow: 'md',
            transform: 'translateY(-2px)',
          },
        },
      },
    },

    Divider: {
      baseStyle: {
        borderColor: 'gray.200',
        maxW: 'sm',
        borderWidth: '1px',
        opacity: 0.5,
      },
    },
  },

  breakpoints: {
    base: '0em',
    sm: '30em',
    md: '48em',
    lg: '62em',
    xl: '80em',
    '2xl': '96em',
  },
});

export default theme;