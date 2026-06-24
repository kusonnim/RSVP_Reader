import type { ReaderTheme } from "../types/reader";

type ThemeSelectorProps = {
  theme: ReaderTheme;
  onThemeChange: (theme: ReaderTheme) => void;
};

const themes: Array<{ label: string; value: ReaderTheme }> = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "Sepia", value: "sepia" },
];

function ThemeSelector({ theme, onThemeChange }: ThemeSelectorProps) {
  return (
    <fieldset className="theme-selector">
      <legend className="visually-hidden">Reader theme</legend>
      {themes.map((option) => (
        <label
          className={`theme-option${
            theme === option.value ? " is-selected" : ""
          }`}
          key={option.value}
        >
          <input
            className="visually-hidden"
            type="radio"
            name="reader-theme"
            value={option.value}
            checked={theme === option.value}
            onChange={() => onThemeChange(option.value)}
          />
          <span className={`theme-swatch theme-swatch-${option.value}`} />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

export default ThemeSelector;

