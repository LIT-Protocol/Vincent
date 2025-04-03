import { useState, useEffect, useRef } from 'react';
import ParameterInput from './ParameterInput';
import { VersionParameter } from '../../types';
import { ParameterType } from '@/services/types/parameterTypes';
import { decodeParameterValue } from '../../utils/parameterDecoding';

interface VersionParametersFormProps {
  versionData: any;
  onChange: (parameters: VersionParameter[]) => void;
  existingParameters?: VersionParameter[];
}

export default function VersionParametersForm({
  versionData,
  onChange,
  existingParameters = []
}: VersionParametersFormProps) {
  const [parameters, setParameters] = useState<VersionParameter[]>([]);
  const initializedRef = useRef(false);
  const processedVersionRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!versionData) return;
    
    const versionKey = `${versionData[1]?.[0]}:${versionData[1]?.[1]}`;
    const shouldInitialize = !initializedRef.current || 
                             (existingParameters && existingParameters.length > 0) ||
                             (versionKey !== processedVersionRef.current);
    
    if (!shouldInitialize && parameters.length > 0) return;
    
    processedVersionRef.current = versionKey;
    
    try {
      const toolsData = versionData[1]?.[3];
      
      if (!toolsData || !Array.isArray(toolsData)) return;
      
      console.log(`Initializing parameters for version: ${versionKey}`);
      const extractedParams: VersionParameter[] = [];
      console.log('Initializing version parameters form with existing parameters:', existingParameters);
      
      if (existingParameters.length > 0) {
        console.log('Existing parameter details:');
        existingParameters.forEach(param => {
          console.log(`${param.name} (type: ${param.type}): ${param.value?.toString().substring(0, 30)}${param.value?.toString().length > 30 ? '...' : ''}`);
        });
      }
      
      toolsData.forEach((tool, toolIndex) => {
        if (!tool || !Array.isArray(tool)) return;
        
        const policies = tool[1];
        
        if (Array.isArray(policies)) {
          policies.forEach((policy, policyIndex) => {
            if (!policy || !Array.isArray(policy)) return;
            
            const paramNames = policy[1];
            const paramTypes = policy[2];
            
            if (Array.isArray(paramNames) && Array.isArray(paramTypes)) {
              paramNames.forEach((name, paramIndex) => {
                if (paramIndex < paramTypes.length) {
                  const paramType = paramTypes[paramIndex];
                  const paramName = typeof name === 'string' && name.trim() !== '' 
                    ? name.trim() 
                    : `param_${paramIndex}`;
                  
                  let existingParam = null;
                  
                  // Match by name AND type (most accurate)
                  existingParam = existingParameters.find(p => 
                    typeof p.name === 'string' && 
                    p.name.toLowerCase() === paramName.toLowerCase() &&
                    p.type === paramType
                  );
                  
                  if (existingParam) {
                    console.log(`Found parameter by name AND type: "${paramName}" (type: ${paramType})`);
                  }
                  
                  const processExistingValue = (existingValue: any, paramType: number) => {
                    // If no existing value, return appropriate default
                    if (existingValue === undefined || existingValue === null) {
                      return getDefaultForType(paramType);
                    }
                    
                    // For hex-encoded values, use the decoder
                    if (typeof existingValue === 'string' && existingValue.startsWith('0x')) {
                      try {
                        return decodeParameterValue(existingValue, paramType);
                      } catch (err) {
                        console.error(`Error decoding value for type ${paramType}:`, err);
                        return existingValue; // Return as is to prevent data loss
                      }
                    }
                    
                    // Return value as is for other types
                    return existingValue;
                  };
                  
                  // Helper function to get default empty value for a type
                  const getDefaultForType = (paramType: number): any => {
                    switch(paramType) {
                      case ParameterType.BOOL:
                      case ParameterType.INT256:
                      case ParameterType.UINT256:
                      case ParameterType.ADDRESS:
                      case ParameterType.STRING:
                      case ParameterType.INT256_ARRAY:
                      case ParameterType.UINT256_ARRAY:
                      case ParameterType.BOOL_ARRAY:
                      case ParameterType.ADDRESS_ARRAY:
                      case ParameterType.STRING_ARRAY:
                        return '';
                      default:
                        return '';
                    }
                  }
                  
                  // Preserve value handling
                  const value = existingParam ? processExistingValue(existingParam.value, paramType) : getDefaultForType(paramType);
                  
                  if (existingParam) {
                    console.log(`Using existing value for "${paramName}": ${value} (type: ${paramType})`);
                  }
                  
                  extractedParams.push({
                    toolIndex,
                    policyIndex,
                    paramIndex,
                    name: paramName,
                    type: paramType,
                    value 
                  });
                }
              });
            }
          });
        }
      });
      
      // Log parameter initialization info - showing which parameters are new vs preserved
      if (!initializedRef.current) {
        console.log('Form initialized with parameters:', extractedParams);
        
        // Log which parameters had values preserved from previous version
        const preservedParams = extractedParams.filter(p => {
          // Empty string is considered empty
          if (p.value === '') return false;
          
          // Array-specific checks
          if (p.type === ParameterType.ADDRESS_ARRAY || 
              p.type === ParameterType.STRING_ARRAY || 
              p.type === ParameterType.INT256_ARRAY || 
              p.type === ParameterType.UINT256_ARRAY ||
              p.type === ParameterType.BOOL_ARRAY) {
            
            // If it's an empty array or empty string
            if (Array.isArray(p.value) && p.value.length === 0) return false;
            if (typeof p.value === 'string' && p.value === '') return false;
            
            // If it's a comma-separated string, check if all values are empty
            if (typeof p.value === 'string') {
              const values = p.value.split(',').map(v => v.trim());
              if (values.every(v => v === '')) {
                return false;
              }
            }
          }
          
          return true;
        });
        
        if (preservedParams.length > 0) {
          console.log(`Preserved ${preservedParams.length} parameter values from previous version:`, 
            preservedParams.map(p => ({ name: p.name, value: p.value }))
          );
        }
        
        // Log which parameters are new and will start with empty values
        const newParams = extractedParams.filter(p => !preservedParams.some(pp => 
          pp.toolIndex === p.toolIndex && 
          pp.policyIndex === p.policyIndex && 
          pp.paramIndex === p.paramIndex
        ));
        
        if (newParams.length > 0) {
          console.log(`${newParams.length} new parameters with empty values:`, 
            newParams.map(p => p.name)
          );
        }
      }
      
      // Set the parameters state without calling onChange directly
      setParameters(extractedParams);
      
      // Mark as initialized
      initializedRef.current = true;
      
    } catch (error) {
      console.error('Error parsing version data:', error);
    }
  }, [versionData, existingParameters]);
  
  useEffect(() => {
    if (initializedRef.current && parameters.length > 0) {
      // Use setTimeout to defer the update to the next tick
      const timeoutId = setTimeout(() => {
        onChange(parameters);
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [parameters, onChange]);
  
  // Add debugging to track parameter changes
  const handleParameterChange = (updatedParam: VersionParameter) => {
    console.log(`Parameter changed: ${updatedParam.name} (${updatedParam.type}) = ${updatedParam.value}`);
    
    // Update the parameters state by replacing the matching parameter
    setParameters(prevParams => {
      const updatedParams = prevParams.map(param => {
        if (param.toolIndex === updatedParam.toolIndex &&
            param.policyIndex === updatedParam.policyIndex && 
            param.paramIndex === updatedParam.paramIndex) {
          return updatedParam;
        }
        return param;
      });
      
      return updatedParams;
    });
  };
  
  // Add a specific useEffect to handle applying existingParameters to the form
  useEffect(() => {
    // Only apply if we have both existing parameters and the form is already initialized
    if (existingParameters && existingParameters.length > 0 && initializedRef.current && parameters.length > 0) {
      // Use a ref to prevent multiple updates for the same set of parameters
      const existingParamsKey = existingParameters.map(p => `${p.name}:${p.value}`).join('|');
      const currentParamsKey = parameters.map(p => `${p.name}:${p.value}`).join('|');
      
      // Skip if the parameters haven't actually changed (prevents loops)
      if (existingParamsKey === currentParamsKey) {
        return;
      }
      
      console.log('Applying existing parameters to form fields:', existingParameters);
      
      // Create a copy of the current parameters
      const updatedParams = [...parameters];
      let hasChanges = false;
      
      // Apply each existing parameter value to the matching form field
      existingParameters.forEach(existingParam => {
        // Find the matching parameter in our form
        const formParamIndex = updatedParams.findIndex(p => 
          (p.name === existingParam.name) || // Match by name
          (p.toolIndex === existingParam.toolIndex && 
           p.policyIndex === existingParam.policyIndex && 
           p.paramIndex === existingParam.paramIndex) // Or match by position
        );
        
        if (formParamIndex !== -1) {
          // Only update if value is different (prevents needless rerenders)
          if (updatedParams[formParamIndex].value !== existingParam.value) {
            // Update the form parameter with the existing value
            updatedParams[formParamIndex] = {
              ...updatedParams[formParamIndex],
              value: existingParam.value
            };
            hasChanges = true;
            console.log(`Applied existing value for "${existingParam.name}": ${existingParam.value}`);
          }
        }
      });
      
      // Only update the parameters state if something actually changed
      if (hasChanges) {
        setParameters(updatedParams);
      }
    }
  // Remove parameters from dependency array to break the loop
  }, [existingParameters]);
  
  if (!parameters.length) {
    return null;
  }
  
  return (
    <div className="version-parameters">
      <h3>Parameter Inputs</h3>
      <div className="parameters-list">
        {parameters.map((param, index) => (
          <ParameterInput
            key={`${param.toolIndex}-${param.policyIndex}-${param.paramIndex}`}
            name={param.name}
            type={param.type}
            value={param.value}
            onChange={(value) => handleParameterChange({
              ...param,
              value
            })}
          />
        ))}
      </div>
    </div>
  );
}
