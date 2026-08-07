import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fileToDataUrl } from "@/lib/media";
import { ImagePlus, Trash2 } from "lucide-react";

interface Props {
  label: string;
  value?: string | undefined;
  onChange: (v: string | undefined) => void;
  hint?: string;
  className?: string;
}

export function ImageUploader({ label, value, onChange, hint, className }: Props) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className={className}>
      <p className="text-sm font-medium text-foreground">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-2 flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          {value ? (
            <img src={value} alt={label} className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => input.current?.click()}>
            อัปโหลดรูป
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(undefined)}>
              <Trash2 className="mr-1 h-4 w-4" /> ลบรูป
            </Button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              onChange(await fileToDataUrl(file));
              toast.success("อัปโหลดรูปภาพสำเร็จ");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
            }
          }}
        />
      </div>
    </div>
  );
}
