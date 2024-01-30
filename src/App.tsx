import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery } from "convex/react";
import { FormEvent, ReactNode, useState } from "react";
import { api } from "../convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionId } from "convex-helpers/react/sessions.js";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "usehooks-ts";

function App() {
  const [sessionId] = useSessionId();
  const prompts = useQuery(api.ai.listPrompts, { count: 10 });

  return (
    <main className="container max-w-3xl flex flex-col gap-8">
      <h1 className="text-4xl font-extrabold my-8 text-center">AI Gallery</h1>
      <PromptForm />
      <div className="grid grid-cols-3 gap-4">
        {prompts?.map((prompt) => (
          <ColoredCard
            key={prompt._id}
            color={prompt.sessionId}
            isOwn={prompt.sessionId === sessionId}
          >
            <Prompted prompt={prompt.prompt}>
              {prompt.result === null ? (
                <Skeleton className="w-full h-full" />
              ) : prompt.result.type === "text" ? (
                <TextContent>{prompt.result.value}</TextContent>
              ) : (
                <ImageContent src={prompt.result.value} />
              )}
            </Prompted>
          </ColoredCard>
        ))}
      </div>
    </main>
  );
}

function PromptForm() {
  const [sessionId] = useSessionId();
  const [prompt, setPrompt] = useState("");
  const [outputType, setOutputType] = useState("text");
  const addPrompt = useMutation(api.ai.addPrompt);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void addPrompt({
      sessionId,
      prompt,
      outputType: outputType as "text" | "image",
    });
    setPrompt("");
  };
  return (
    <form className="flex items-center gap-2" onSubmit={handleSubmit}>
      <Input
        placeholder="Enter prompt..."
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
      />
      <Select value={outputType} onValueChange={setOutputType}>
        <SelectTrigger className="w-[10rem]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Output</SelectLabel>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem disabled value="image">
              Image
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button type="submit" disabled={prompt === ""}>
        Generate
      </Button>
    </form>
  );
}

function Prompted({
  children,
  prompt,
}: {
  children: ReactNode;
  prompt: string;
}) {
  const [showPrompt, setShowPrompt] = useState(false);
  return (
    <div
      className="cursor-pointer w-full h-full p-2"
      onClick={() => setShowPrompt(!showPrompt)}
    >
      {showPrompt ? (
        <div className="text-sm overflow-scroll p-2">{prompt}</div>
      ) : (
        children
      )}
    </div>
  );
}

function TextContent({ children }: { children: ReactNode }) {
  return (
    <div className="w-full h-full p-2 text-sm overflow-scroll">{children}</div>
  );
}

function ImageContent({ src }: { src: string | null }) {
  return src === null ? (
    "Image was deleted"
  ) : (
    <img src={src} className="object-contain h-full w-full" />
  );
}

function ColoredCard({
  color,
  children,
  isOwn,
}: {
  color: string;
  children: ReactNode;
  isOwn: boolean;
}) {
  const isDark = useMediaQuery("(prefers-color-scheme: dark)");
  const hue = stringToHue(color);
  return (
    <div
      className={cn(
        "border h-48 rounded-xl bg-card text-card-foreground",
        "shadow hover:shadow-lg dark:hover:shadow-[0_0_15px_rgba(255,255,255,.15)]"
      )}
      style={{
        backgroundColor: `hsl(${hue}, ${isDark ? "10%, 10%" : "40%, 97%"})`,
        borderColor: `hsl(${hue}, ${
          isOwn
            ? isDark
              ? "50%, 50%"
              : "90%, 30%"
            : isDark
            ? "20%, 30%"
            : "90%, 90%"
        })`,
      }}
    >
      {children}
    </div>
  );
}

function stringToHue(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.floor((360 * Math.abs(hash % 17)) / 17);
}

export default App;
