import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      500: '#319795',
      600: '#2c7a7b',
    },
    gray: {
      50: '#f7fafc',
      100: '#edf2f7',
      300: '#e2e8f0',
      500: '#a0aec0',
      600: '#4a5568',
      700: '#2d3748',
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
      600: '#F7E600',
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
      },
    },
  },

  components: {
    Input: {
      baseStyle: {
        field: {
          borderColor: 'gray.300',
          borderWidth: '1px',
          borderRadius: 'md',
          _focus: {
            borderColor: 'brand.500',
            boxShadow: `0 0 0 1px var(--chakra-colors-brand-500)`,
          },
        },
      },
      sizes: {
        md: {
          field: {
            fontSize: { base: 'sm', md: 'md' },
            padding: { base: '2', md: '3' },
            lineHeight: 'normal',
          },
        },
      },
    },

    Button: {
      baseStyle: {
        borderRadius: 'md',
        fontWeight: 'medium',
        _focus: {
          boxShadow: '0 0 0 3px var(--chakra-colors-brand-500)',
        },
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
          },
        },
        outline: {
          borderColor: 'gray.300',
          color: 'gray.700',
          _hover: {
            bg: 'gray.100',
          },
        },
        link: {
          color: 'blue.500',
          _hover: {
            color: 'blue.600',
            textDecoration: 'underline',
          },
        },
        // Updated Kakao variant: White background with border by default, yellow on hover
        kakao: {
          bg: 'white',
          color: 'gray.700',
          borderWidth: '1px',
          borderColor: 'gray.300',
          _hover: {
            bg: 'kakao.500',
            color: 'black',
          },
        },
        // Updated Naver variant: White background with border by default, green on hover
        naver: {
          bg: 'white',
          color: 'gray.700',
          borderWidth: '1px',
          borderColor: 'gray.300',
          _hover: {
            bg: 'naver.500',
            color: 'white',
          },
        },
        google: {
          bg: 'google.500',
          color: 'gray.700',
          borderWidth: '1px',
          borderColor: 'gray.300',
          _hover: {
            bg: 'google.600',
          },
        },
        homeButton: {
          bg: 'google.500',
          color: 'gray.700',
          borderWidth: '1px',
          borderColor: 'gray.300',
          _hover: {
            bg: 'google.600',
          },
        },
        homeButtonSecondary: {
          bg: 'google.500',
          color: 'gray.700',
          borderWidth: '1px',
          borderColor: 'gray.300',
          _hover: {
            bg: 'google.600',
          },
        },
      },
      sizes: {
        md: {
          fontSize: { base: 'sm', md: 'md' },
          padding: { base: '2', md: '3' },
          height: { base: '36px', md: '40px' },
        },
      },
    },

    FormLabel: {
      baseStyle: {
        color: 'gray.600',
        fontSize: { base: 'sm', md: 'md' },
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
          borderColor: 'gray.300',
          borderRadius: 'lg',
          boxShadow: 'md',
          p: { base: '3', md: '4' },
          maxW: 'sm',
          mx: 'auto',
        },
      },
    },

    Divider: {
      baseStyle: {
        borderColor: 'gray.300',
        maxW: 'sm',
        borderWidth: '1px',
        opacity: 0.6,
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