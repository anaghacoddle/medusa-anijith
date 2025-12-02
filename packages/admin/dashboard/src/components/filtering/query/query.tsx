import { Input } from "@medusajs/ui"
import debounce from "lodash.debounce"
import { ChangeEvent, useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"

type QueryProps = {
  placeholder?: string
}

export const Query = ({ placeholder }: QueryProps) => {
  const { t } = useTranslation()
  const placeholderText = placeholder || t("general.search")

  const [searchParams, setSearchParams] = useSearchParams()
  const [inputValue, setInputValue] = useState(searchParams.get("q") || "")

  const updateSearchParams = useCallback(
    (newValue: string) => {
      if (!newValue) {
        setSearchParams((prev) => {
          prev.delete("q");
          return prev;
        });
        return;
      }

      setSearchParams((prev) => ({ ...prev, q: newValue || "" }));
    },
    [setSearchParams]
  );

  const debouncedUpdate = useMemo(() => {
    return debounce((newValue: string) => {
      updateSearchParams(newValue);
    }, 500);
  }, [updateSearchParams]);

  useEffect(() => {
    debouncedUpdate(inputValue)

    return () => {
      debouncedUpdate.cancel()
    }
  }, [inputValue, debouncedUpdate])

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value)
  }

  return (
    <Input
      type="search"
      size="small"
      value={inputValue}
      onChange={handleInputChange}
      placeholder={placeholderText}
    />
  )
}
