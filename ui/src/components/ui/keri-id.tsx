import { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';
import { Button } from './button';
import { useUser } from '@/lib/user-provider';
import { getDSL } from '@/lib/dsl';

interface KeriIDProps {
  id: string;
  type?: 'kel' | 'tel' | 'schema' | 'acdc';
  showCopy?: boolean;
  className?: string;
  onCopy?: (message: string) => void;
}

export function KeriID({ id, type, showCopy = true, className = '', onCopy }: KeriIDProps) {
  const [alias, setAlias] = useState<string | null>(null);
  const { currentUser } = useUser();

  useEffect(() => {
    const loadAlias = async () => {
      if (!id || !currentUser) return;

      try {
        const dsl = await getDSL(currentUser.id);

        // Try to find alias based on type
        if (type === 'kel') {
          // Check if it's an account AID
          const account = await dsl.getAccountByAid(id);
          if (account) {
            setAlias(account.alias);
            return;
          }
        } else if (type === 'tel') {
          // Check registries
          const accountNames = await dsl.accountNames();
          for (const accountName of accountNames) {
            const accountDsl = await dsl.account(accountName);
            if (!accountDsl) continue;

            const registryAliases = await accountDsl.listRegistries();
            for (const registryAlias of registryAliases) {
              const registryDsl = await accountDsl.registry(registryAlias);
              if (registryDsl && registryDsl.registry.registryId === id) {
                setAlias(registryAlias);
                return;
              }
            }
          }
        } else if (type === 'schema') {
          // Check schemas
          const schemaAliases = await dsl.listSchemas();
          for (const schemaAlias of schemaAliases) {
            const schemaDsl = await dsl.schema(schemaAlias);
            if (schemaDsl && schemaDsl.schema.schemaId === id) {
              setAlias(schemaAlias);
              return;
            }
          }
        } else if (type === 'acdc') {
          // Check credentials across all registries
          const accountNames = await dsl.accountNames();
          for (const accountName of accountNames) {
            const accountDsl = await dsl.account(accountName);
            if (!accountDsl) continue;

            const registryAliases = await accountDsl.listRegistries();
            for (const registryAlias of registryAliases) {
              const registryDsl = await accountDsl.registry(registryAlias);
              if (!registryDsl) continue;

              const credentials = await registryDsl.listCredentials();
              for (const cred of credentials) {
                if (cred.credentialId === id && cred.alias) {
                  setAlias(cred.alias);
                  return;
                }
              }
            }
          }
        }

        // No alias found
        setAlias(null);
      } catch (error) {
        console.error('Failed to load alias:', error);
        setAlias(null);
      }
    };

    loadAlias();
  }, [id, type, currentUser]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(id);
    onCopy?.(`${alias || 'ID'} copied to clipboard`);
  };

  if (!id) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 min-w-0">
        {alias ? (
          <div>
            <div className="font-medium">{alias}</div>
            <div className="text-xs text-muted-foreground font-mono truncate">
              {id}
            </div>
          </div>
        ) : (
          <div className="text-xs font-mono break-all">
            {id}
          </div>
        )}
      </div>
      {showCopy && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 w-6 p-0 flex-shrink-0"
          title="Copy ID"
        >
          <Copy className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
