export default function ApplicationLogo(props) {
    console.log(props.logo_img);
    return (
        <div
            {...props.className}
        >
            <img src={props.logo_img} alt="" />
        </div>
    );
}
