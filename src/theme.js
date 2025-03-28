import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      500: '#319795', // 기본 Teal 색상
      600: '#2c7a7b', // 호버 시 색상
    },
    gray: {
      50: '#f7fafc', // 배경색 등
      600: '#4a5568',
      700: '#2d3748',
    },
    blue: {
      500: '#3182ce',
      600: '#2b6cb0',
    },
  },
  components: {
    Input: {
      baseStyle: {
        field: {
          borderColor: '#e2e8f0',
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px #319795',
          },
        },
      },
      sizes: {
        md: {
          field: {
            fontSize: { base: '0.875rem', md: '1rem' },
            padding: { base: '8px', md: '12px' },
          },
        },
      },
    },
    Button: {
      baseStyle: {
        _hover: {
          bg: 'brand.600',
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
        link: {
          color: 'blue.500',
          _hover: {
            color: 'blue.600',
            textDecoration: 'underline',
          },
        },
      },
      sizes: {
        md: {
          fontSize: { base: '0.875rem', md: '1rem' },
          padding: { base: '8px', md: '12px' },
        },
      },
    },
    FormLabel: {
      baseStyle: {
        color: 'gray.600',
        fontSize: { base: '0.875rem', md: '1rem' },
      },
    },
    Text: {
      baseStyle: {
        color: 'gray.700',
      },
    },
  },
});

export default theme;
