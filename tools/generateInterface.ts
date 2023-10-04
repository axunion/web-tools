const interfaces: string[] = [];

const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const interfaceExists = (interfaceDefinition: string): boolean => {
  return interfaces.some((item) => item.includes(interfaceDefinition));
};

export const generateInterfaces = (
  obj: object,
  name = 'RootObject',
): string => {
  const generateInterface = (obj: object, name: string): string | null => {
    let result = `interface ${name} {\n`;

    for (const [key, value] of Object.entries(obj)) {
      const type = typeof value;

      if (value instanceof Map) {
        const keyType = typeof Array.from(value.keys())[0];
        const valueType = typeof Array.from(value.values())[0];
        result += `  ${key}: Map<${keyType}, ${valueType}>;\n`;
        continue;
      }

      if (type === 'object') {
        if (Array.isArray(value)) {
          const elementType = value.length > 0 ? typeof value[0] : 'any';

          if (elementType === 'object') {
            const subInterfaceName = `${capitalizeFirstLetter(key)}Element`;
            const subInterface = generateInterface(value[0], subInterfaceName);

            if (subInterface && !interfaceExists(subInterface)) {
              interfaces.push(subInterface);
            }

            result += `  ${key}: ${subInterfaceName}[];\n`;
          } else {
            result += `  ${key}: ${elementType}[];\n`;
          }
        } else {
          const subInterfaceName = `${capitalizeFirstLetter(key)}`;
          const subInterface = generateInterface(value, subInterfaceName);

          if (subInterface && !interfaceExists(subInterface)) {
            interfaces.push(subInterface);
          }

          result += `  ${key}: ${subInterfaceName};\n`;
        }
      } else {
        result += `  ${key}: ${type};\n`;
      }
    }

    result += `}\n`;

    return interfaceExists(result) ? null : result;
  };

  const rootInterface = generateInterface(obj, name);

  if (rootInterface) {
    interfaces.push(rootInterface);
  }

  return interfaces.join('\n');
};
