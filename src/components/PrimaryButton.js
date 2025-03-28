import { Button } from "@chakra-ui/react";

const PrimaryButton = ({ children, onClick }) => (
  <Button colorScheme="brand" size="md" onClick={onClick}>
    {children}
  </Button>
);

export default PrimaryButton;
